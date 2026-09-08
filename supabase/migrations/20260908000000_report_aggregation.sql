create index if not exists transactions_vehicle_in_idx
  on public.transactions (vehicle_in desc);

create index if not exists transactions_status_idx
  on public.transactions (status);

create index if not exists transactions_service_id_idx
  on public.transactions (service_id);

create index if not exists transactions_payment_method_idx
  on public.transactions (payment_method);

create index if not exists transaction_staff_transaction_id_idx
  on public.transaction_staff (transaction_id);

create index if not exists transaction_staff_staff_id_idx
  on public.transaction_staff (staff_id);

create index if not exists transaction_add_ons_transaction_id_idx
  on public.transaction_add_ons (transaction_id);

create index if not exists transaction_add_ons_seller_id_idx
  on public.transaction_add_ons (seller_id);

create or replace function public.get_report_aggregates(
  p_start_at timestamptz default null,
  p_end_at timestamptz default null,
  p_status text default null,
  p_service_id uuid default null,
  p_payment_method text default null,
  p_staff_id uuid default null,
  p_search text default null
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
with filtered_transactions as (
  select t.*
  from public.transactions t
  where (p_start_at is null or t.vehicle_in >= p_start_at)
    and (p_end_at is null or t.vehicle_in < p_end_at)
    and (p_status is null or p_status = 'all' or t.status = p_status)
    and (p_service_id is null or t.service_id = p_service_id)
    and (p_payment_method is null or p_payment_method = 'all' or t.payment_method = p_payment_method)
    and (
      p_staff_id is null
      or exists (
        select 1
        from public.transaction_staff ts_filter
        where ts_filter.transaction_id = t.id
          and ts_filter.staff_id = p_staff_id
      )
    )
    and (
      p_search is null
      or p_search = ''
      or t.order_id ilike '%' || p_search || '%'
      or t.customer_name ilike '%' || p_search || '%'
      or t.plate_number ilike '%' || p_search || '%'
    )
),
kpis as (
  select
    count(*)::integer as transaction_count,
    count(*) filter (where status = 'completed')::integer as completed_count,
    count(*) filter (where status = 'cancelled')::integer as cancelled_count,
    count(*) filter (where status not in ('completed', 'cancelled'))::integer as pending_in_progress_count,
    coalesce(sum(total_price) filter (where status = 'completed'), 0)::numeric as total_revenue
  from filtered_transactions
),
revenue_by_day as (
  select coalesce(jsonb_agg(jsonb_build_object('date', report_date, 'revenue', revenue) order by report_date), '[]'::jsonb) as value
  from (
    select (vehicle_in at time zone 'Asia/Manila')::date::text as report_date,
           coalesce(sum(total_price) filter (where status = 'completed'), 0)::numeric as revenue
    from filtered_transactions
    where vehicle_in is not null
    group by 1
  ) grouped
),
revenue_by_service as (
  select coalesce(jsonb_agg(jsonb_build_object('service', service_name, 'revenue', revenue) order by service_name), '[]'::jsonb) as value
  from (
    select coalesce(s.service_name, 'Unknown Service') as service_name,
           coalesce(sum(t.total_price) filter (where t.status = 'completed'), 0)::numeric as revenue
    from filtered_transactions t
    left join public.services s on s.id = t.service_id
    group by 1
  ) grouped
),
payment_breakdown as (
  select coalesce(jsonb_agg(jsonb_build_object('method', payment_method, 'count', total_count) order by payment_method), '[]'::jsonb) as value
  from (
    select coalesce(payment_method, 'Other') as payment_method, count(*)::integer as total_count
    from filtered_transactions
    group by 1
  ) grouped
),
addon_performance as (
  select coalesce(jsonb_agg(jsonb_build_object('label', label, 'count', total_count, 'revenue', revenue) order by label), '[]'::jsonb) as value
  from (
    select coalesce(a.label, 'Add-on') as label,
           count(*)::integer as total_count,
           coalesce(sum(ta.price), 0)::numeric as revenue
    from filtered_transactions t
    join public.transaction_add_ons ta on ta.transaction_id = t.id
    left join public.add_ons a on a.id::text = ta.add_on_id
    group by 1
  ) grouped
),
staff_commissions as (
  select coalesce(jsonb_agg(jsonb_build_object('name', name, 'commission', commission) order by name), '[]'::jsonb) as value
  from (
    select coalesce(s.name, 'Staff') as name,
           coalesce(sum(ts.commission_amount), 0)::numeric as commission
    from filtered_transactions t
    join public.transaction_staff ts on ts.transaction_id = t.id
    left join public.staffs s on s.id = ts.staff_id
    group by 1
  ) grouped
),
topup_sellers as (
  select coalesce(jsonb_agg(jsonb_build_object('name', name, 'count', total_count, 'revenue', revenue) order by name), '[]'::jsonb) as value
  from (
    select coalesce(s.name, 'Unknown Seller') as name,
           count(*)::integer as total_count,
           coalesce(sum(ta.price), 0)::numeric as revenue
    from filtered_transactions t
    join public.transaction_add_ons ta on ta.transaction_id = t.id
    left join public.staffs s on s.id = ta.seller_id
    where ta.seller_id is not null
    group by 1
  ) grouped
)
select jsonb_build_object(
  'kpis', jsonb_build_object(
    'totalRevenue', k.total_revenue,
    'transactionCount', k.transaction_count,
    'averageTicket', case when k.completed_count = 0 then 0 else k.total_revenue / k.completed_count end,
    'completedCount', k.completed_count,
    'cancelledCount', k.cancelled_count,
    'pendingInProgressCount', k.pending_in_progress_count,
    'totalCommissions', coalesce((select sum(ts.commission_amount) from filtered_transactions t join public.transaction_staff ts on ts.transaction_id = t.id), 0)
  ),
  'charts', jsonb_build_object(
    'revenueByDay', (select value from revenue_by_day),
    'revenueByService', (select value from revenue_by_service),
    'paymentMethodBreakdown', (select value from payment_breakdown),
    'addOnPerformance', (select value from addon_performance),
    'staffCommissionSummary', (select value from staff_commissions),
    'topUpSellerSummary', (select value from topup_sellers)
  )
)
from kpis k;
$$;

revoke all on function public.get_report_aggregates(timestamptz, timestamptz, text, uuid, text, uuid, text) from public;
grant execute on function public.get_report_aggregates(timestamptz, timestamptz, text, uuid, text, uuid, text) to anon, authenticated;
