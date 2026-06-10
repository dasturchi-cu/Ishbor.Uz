-- Launch security P1 fixes (2026-06-11)
-- 1) Profile RLS: drop full-row participant access; safe peer view
-- 2) payment_intents: clients cannot UPDATE (webhooks use service_role)
-- 3) Launch readiness checks for the above

-- ─── Safe peer profile view (no email/phone/wallet/telegram/admin flags) ─────
create or replace view public.participant_profiles
with (security_invoker = false) as
select
  id,
  role,
  full_name,
  avatar_url,
  username,
  bio,
  region,
  specialty,
  skills,
  hourly_rate,
  experience_level,
  languages,
  is_verified,
  portfolio_urls,
  created_at
from public.profiles;

revoke all on public.participant_profiles from public;
revoke all on public.participant_profiles from authenticated;
grant select on public.participant_profiles to service_role;

drop policy if exists "Order participants can view counterpart profile" on public.profiles;

-- ─── payment_intents: read + insert only for clients; updates via service_role ─
drop policy if exists "Clients update own payment intents" on public.payment_intents;

-- ─── Launch readiness: verify P1 policies applied ───────────────────────────
create or replace function public.check_launch_readiness()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb := '{}'::jsonb;
  has_profile_guard boolean;
  has_rate_limit_table boolean;
  profiles_rls boolean;
  has_vacancy_app_guard boolean;
  has_participant_view boolean;
  has_order_participant_leak boolean;
  has_payment_intent_client_update boolean;
begin
  select exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'profiles'
      and t.tgname = 'guard_privileged_profile_columns'
      and not t.tgisinternal
  ) into has_profile_guard;

  select exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'rate_limit_hits'
  ) into has_rate_limit_table;

  select c.relrowsecurity
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'profiles'
  into profiles_rls;

  select exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'vacancy_applications'
      and t.tgname = 'guard_vacancy_application_status'
      and not t.tgisinternal
  ) into has_vacancy_app_guard;

  select exists (
    select 1
    from information_schema.views
    where table_schema = 'public'
      and table_name = 'participant_profiles'
  ) into has_participant_view;

  select exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Order participants can view counterpart profile'
  ) into has_order_participant_leak;

  select exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'payment_intents'
      and policyname = 'Clients update own payment intents'
      and cmd = 'UPDATE'
  ) into has_payment_intent_client_update;

  result := jsonb_build_object(
    'profiles_insert_guard_trigger', has_profile_guard,
    'rate_limit_hits_table', has_rate_limit_table,
    'profiles_rls_enabled', coalesce(profiles_rls, false),
    'vacancy_applications_guard_trigger', has_vacancy_app_guard,
    'participant_profiles_view', has_participant_view,
    'profiles_order_participant_leak', has_order_participant_leak,
    'payment_intents_client_update', has_payment_intent_client_update
  );

  return result;
end;
$$;

revoke all on function public.check_launch_readiness() from public;
grant execute on function public.check_launch_readiness() to service_role;
