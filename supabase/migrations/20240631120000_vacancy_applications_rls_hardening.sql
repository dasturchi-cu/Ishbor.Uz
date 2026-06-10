-- Vacancy applications: prevent freelancers from self-accepting via direct Supabase client

drop policy if exists "Freelancers manage own vacancy applications" on public.vacancy_applications;

create policy "Freelancers read own vacancy applications"
  on public.vacancy_applications for select
  using (auth.uid() = freelancer_id);

create policy "Freelancers apply to vacancies"
  on public.vacancy_applications for insert
  with check (
    auth.uid() = freelancer_id
    and status = 'submitted'
  );

create policy "Freelancers withdraw own vacancy applications"
  on public.vacancy_applications for delete
  using (
    auth.uid() = freelancer_id
    and status in ('submitted', 'reviewed')
  );

drop policy if exists "Clients read applications on own vacancies" on public.vacancy_applications;
create policy "Clients read applications on own vacancies"
  on public.vacancy_applications for select
  using (
    exists (
      select 1 from public.vacancies v
      where v.id = vacancy_id and v.client_id = auth.uid()
    )
  );

create policy "Clients update vacancy application status"
  on public.vacancy_applications for update
  using (
    exists (
      select 1 from public.vacancies v
      where v.id = vacancy_id and v.client_id = auth.uid()
    )
  );

create or replace function public.guard_vacancy_application_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status is distinct from 'submitted' then
      raise exception 'FORBIDDEN_FIELD: status';
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' and auth.uid() = old.freelancer_id then
    raise exception 'FORBIDDEN: freelancers cannot update applications';
  end if;

  if new.status is distinct from old.status then
    if not exists (
      select 1 from public.vacancies v
      where v.id = new.vacancy_id and v.client_id = auth.uid()
    ) then
      raise exception 'FORBIDDEN_FIELD: status';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_vacancy_application_status on public.vacancy_applications;
create trigger guard_vacancy_application_status
  before insert or update on public.vacancy_applications
  for each row execute function public.guard_vacancy_application_status();

-- Extend launch readiness checks
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

  result := jsonb_build_object(
    'profiles_insert_guard_trigger', has_profile_guard,
    'rate_limit_hits_table', has_rate_limit_table,
    'profiles_rls_enabled', coalesce(profiles_rls, false),
    'vacancy_applications_guard_trigger', has_vacancy_app_guard
  );

  return result;
end;
$$;

revoke all on function public.check_launch_readiness() from public;
grant execute on function public.check_launch_readiness() to service_role;
