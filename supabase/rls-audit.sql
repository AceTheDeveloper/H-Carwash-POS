-- Run this in Supabase SQL Editor to verify the current single-organization RLS posture.
-- This is intentionally diagnostic: the app currently authenticates with Clerk,
-- while Supabase is accessed with the anonymous key.

select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'transactions',
    'transaction_add_ons',
    'transaction_staff',
    'services',
    'staffs',
    'add_ons',
    'inclusions',
    'promos'
  )
order by c.relname;

select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'transactions',
    'transaction_add_ons',
    'transaction_staff',
    'services',
    'staffs',
    'add_ons',
    'inclusions',
    'promos'
  )
order by tablename, policyname;

-- Before enabling restrictive RLS, the server client must use a Supabase JWT
-- containing the same organization context or a service-role client kept server-side.
