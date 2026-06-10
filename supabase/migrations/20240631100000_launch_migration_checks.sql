-- Launch readiness checks (health/ready + verify-db)

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

  result := jsonb_build_object(
    'profiles_insert_guard_trigger', has_profile_guard,
    'rate_limit_hits_table', has_rate_limit_table,
    'profiles_rls_enabled', coalesce(profiles_rls, false)
  );

  return result;
end;
$$;

revoke all on function public.check_launch_readiness() from public;
grant execute on function public.check_launch_readiness() to service_role;
