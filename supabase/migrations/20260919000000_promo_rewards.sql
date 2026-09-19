-- Adds support for reward-based promos (free add-on, or an add-on at a
-- special bundle price) alongside the existing percentage/fixed discount
-- promos. All promo types are still redeemed through the same `code` /
-- QR-scan flow already in place.
--
-- NOTE: this assumes public.add_ons.id is uuid (matching the existing
-- transaction_add_ons.add_on_id FK pattern). If your add_ons.id is a
-- different type, change `uuid` below to match before running this.

alter table public.promos
  add column if not exists promo_type text not null default 'discount',
  add column if not exists reward_add_on_id uuid references public.add_ons (id) on delete set null,
  add column if not exists reward_price numeric;

alter table public.promos
  drop constraint if exists promos_promo_type_check;

alter table public.promos
  add constraint promos_promo_type_check
  check (promo_type in ('discount', 'free_add_on', 'special_add_on_price'));

create index if not exists promos_reward_add_on_id_idx
  on public.promos (reward_add_on_id);