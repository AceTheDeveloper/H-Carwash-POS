-- Unpaid orders (partnerships, etc.)
--
-- A transaction can now be saved with payment_method = 'unpaid'. These orders
-- are still washed, still earn staff commission and still count as sales on the
-- daily log, but no money is collected, so they are listed in the UNPAIDS
-- table of the daily sheet and subtracted from Net Cash.
--
--   unpaid_note : who/what it is for (partner name, particulars) - shown to admins
--   paid_at     : set when an admin later settles an unpaid order
--
-- Run this whole file once in the Supabase SQL Editor.

alter table public.transactions
  add column if not exists unpaid_note text,
  add column if not exists paid_at timestamptz;

alter table public.drafts
  add column if not exists unpaid_note text;

-- payment_method may have a CHECK constraint that only allows cash / qr / card.
-- Drop any CHECK on that column (whatever it is named) and re-add one that also
-- allows 'unpaid'. This is a no-op for tables that have no such constraint.
do $$
declare
  tbl text;
  con record;
begin
  foreach tbl in array array['transactions', 'drafts'] loop
    for con in
      select c.conname
      from pg_constraint c
      where c.conrelid = format('public.%I', tbl)::regclass
        and c.contype = 'c'
        and pg_get_constraintdef(c.oid) ilike '%payment_method%'
    loop
      execute format('alter table public.%I drop constraint %I', tbl, con.conname);
    end loop;

    execute format(
      'alter table public.%I add constraint %I check (payment_method is null or payment_method in (''cash'', ''qr'', ''card'', ''unpaid''))',
      tbl,
      tbl || '_payment_method_check'
    );
  end loop;
end $$;

-- Fast lookup of everything still owed.
create index if not exists transactions_unpaid_idx
  on public.transactions (vehicle_in desc)
  where payment_method = 'unpaid';
