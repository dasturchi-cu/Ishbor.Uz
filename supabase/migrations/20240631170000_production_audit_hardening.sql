-- Production audit hardening (2026-06-12)
-- Services moderation RLS, project application guards, profile suspension guard,
-- orders/payment_intents client INSERT removal, messages policies, auto-release index.

-- ─── Profile privileged columns: suspension + admin_role ─────────────────────
create or replace function public.guard_privileged_profile_columns()
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
    if coalesce(new.wallet_balance, 0) <> 0 then
      raise exception 'FORBIDDEN_FIELD: wallet_balance';
    end if;
    if coalesce(new.is_admin, false) then
      raise exception 'FORBIDDEN_FIELD: is_admin';
    end if;
    if coalesce(new.is_banned, false) then
      raise exception 'FORBIDDEN_FIELD: is_banned';
    end if;
    if coalesce(new.is_verified, false) then
      raise exception 'FORBIDDEN_FIELD: is_verified';
    end if;
    if coalesce(new.is_suspended, false) then
      raise exception 'FORBIDDEN_FIELD: is_suspended';
    end if;
    if new.suspended_until is not null then
      raise exception 'FORBIDDEN_FIELD: suspended_until';
    end if;
    if new.admin_role is not null then
      raise exception 'FORBIDDEN_FIELD: admin_role';
    end if;
    return new;
  end if;

  if new.wallet_balance is distinct from old.wallet_balance then
    raise exception 'FORBIDDEN_FIELD: wallet_balance';
  end if;
  if new.is_admin is distinct from old.is_admin then
    raise exception 'FORBIDDEN_FIELD: is_admin';
  end if;
  if new.is_banned is distinct from old.is_banned then
    raise exception 'FORBIDDEN_FIELD: is_banned';
  end if;
  if new.is_verified is distinct from old.is_verified then
    raise exception 'FORBIDDEN_FIELD: is_verified';
  end if;
  if new.is_suspended is distinct from old.is_suspended then
    raise exception 'FORBIDDEN_FIELD: is_suspended';
  end if;
  if new.suspended_until is distinct from old.suspended_until then
    raise exception 'FORBIDDEN_FIELD: suspended_until';
  end if;
  if new.admin_role is distinct from old.admin_role then
    raise exception 'FORBIDDEN_FIELD: admin_role';
  end if;
  if new.referred_by is distinct from old.referred_by and old.referred_by is not null then
    raise exception 'FORBIDDEN_FIELD: referred_by';
  end if;

  return new;
end;
$$;

-- ─── Services: moderation-aware catalog SELECT ───────────────────────────────
drop policy if exists "Services are viewable when not hidden or owner" on public.services;
drop policy if exists "Services are viewable when approved and not hidden or owner" on public.services;
create policy "Services are viewable when approved and not hidden or owner"
  on public.services for select
  using (
    (
      moderation_status = 'approved'
      and is_hidden = false
    )
    or (select auth.uid()) = freelancer_id
  );

create or replace function public.guard_service_moderation_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') = 'service_role' then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.moderation_status is distinct from old.moderation_status then
      raise exception 'FORBIDDEN_FIELD: moderation_status';
    end if;
    if new.moderated_by is distinct from old.moderated_by then
      raise exception 'FORBIDDEN_FIELD: moderated_by';
    end if;
    if new.moderated_at is distinct from old.moderated_at then
      raise exception 'FORBIDDEN_FIELD: moderated_at';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_service_moderation_columns on public.services;
create trigger guard_service_moderation_columns
  before update on public.services
  for each row execute function public.guard_service_moderation_columns();

-- ─── Project applications: status guard (mirror vacancy applications) ────────
drop policy if exists "Freelancers can apply" on public.project_applications;
create policy "Freelancers can apply"
  on public.project_applications for insert
  with check (
    (select auth.uid()) = freelancer_id
    and status = 'submitted'
  );

create or replace function public.guard_project_application_status()
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

  if tg_op = 'UPDATE' and (select auth.uid()) = old.freelancer_id then
    raise exception 'FORBIDDEN: freelancers cannot update applications';
  end if;

  if new.status is distinct from old.status then
    if not exists (
      select 1 from public.projects p
      where p.id = new.project_id and p.client_id = (select auth.uid())
    ) then
      raise exception 'FORBIDDEN_FIELD: status';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_project_application_status on public.project_applications;
create trigger guard_project_application_status
  before insert or update on public.project_applications
  for each row execute function public.guard_project_application_status();

-- ─── Orders / payment_intents: API-only creation ─────────────────────────────
drop policy if exists "Clients can create orders" on public.orders;
drop policy if exists "Clients insert own payment intents" on public.payment_intents;

-- ─── Messages: conversation participants + receiver validation ───────────────
drop policy if exists "Messages visible to participants" on public.messages;
create policy "Messages visible to participants"
  on public.messages for select
  using (
    (select auth.uid()) = sender_id
    or (select auth.uid()) = receiver_id
    or (
      conversation_id is not null
      and exists (
        select 1 from public.conversations c
        where c.id = conversation_id
          and (select auth.uid()) = any (c.participant_ids)
      )
    )
    or (
      order_id is not null
      and exists (
        select 1 from public.orders o
        where o.id = order_id
          and (
            o.client_id = (select auth.uid())
            or o.freelancer_id = (select auth.uid())
          )
      )
    )
  );

drop policy if exists "Participants can send messages" on public.messages;
create policy "Participants can send messages"
  on public.messages for insert
  with check (
    (select auth.uid()) = sender_id
    and receiver_id is not null
    and receiver_id <> (select auth.uid())
    and (
      (
        order_id is not null
        and exists (
          select 1 from public.orders o
          where o.id = order_id
            and (
              (
                o.client_id = (select auth.uid())
                and o.freelancer_id = receiver_id
              )
              or (
                o.freelancer_id = (select auth.uid())
                and o.client_id = receiver_id
              )
            )
        )
      )
      or (
        conversation_id is not null
        and exists (
          select 1 from public.conversations c
          where c.id = conversation_id
            and (select auth.uid()) = any (c.participant_ids)
            and receiver_id = any (c.participant_ids)
        )
      )
    )
  );

-- ─── Performance: escrow auto-release scan ───────────────────────────────────
create index if not exists orders_auto_release_pending_idx
  on public.orders (auto_release_at)
  where status = 'delivered'
    and payment_status = 'held'
    and coalesce(auto_released, false) = false;

-- ─── FK index: bank_accounts.verified_by ───────────────────────────────────
create index if not exists bank_accounts_verified_by_idx
  on public.bank_accounts (verified_by)
  where verified_by is not null;

-- ─── proposals view: explicit columns ────────────────────────────────────────
create or replace view public.proposals
with (security_invoker = true) as
select
  id,
  project_id,
  freelancer_id,
  cover_letter,
  proposed_budget,
  proposed_days,
  status,
  created_at,
  updated_at
from public.project_applications;

-- ─── Extended launch readiness ─────────────────────────────────────────────
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
  has_project_app_guard boolean;
  has_service_mod_guard boolean;
  has_participant_view boolean;
  has_order_participant_leak boolean;
  has_payment_intent_client_update boolean;
  has_orders_client_insert boolean;
  has_payment_intent_client_insert boolean;
  has_services_includes boolean;
  has_services_faq boolean;
  participant_view_invoker boolean;
begin
  select exists (
    select 1 from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'profiles'
      and t.tgname = 'guard_privileged_profile_columns' and not t.tgisinternal
  ) into has_profile_guard;

  select exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'rate_limit_hits'
  ) into has_rate_limit_table;

  select c.relrowsecurity from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'profiles'
  into profiles_rls;

  select exists (
    select 1 from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'vacancy_applications'
      and t.tgname = 'guard_vacancy_application_status' and not t.tgisinternal
  ) into has_vacancy_app_guard;

  select exists (
    select 1 from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'project_applications'
      and t.tgname = 'guard_project_application_status' and not t.tgisinternal
  ) into has_project_app_guard;

  select exists (
    select 1 from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'services'
      and t.tgname = 'guard_service_moderation_columns' and not t.tgisinternal
  ) into has_service_mod_guard;

  select exists (
    select 1 from information_schema.views
    where table_schema = 'public' and table_name = 'participant_profiles'
  ) into has_participant_view;

  select exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
      and policyname = 'Order participants can view counterpart profile'
  ) into has_order_participant_leak;

  select exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'payment_intents'
      and policyname = 'Clients update own payment intents' and cmd = 'UPDATE'
  ) into has_payment_intent_client_update;

  select exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'orders'
      and policyname = 'Clients can create orders' and cmd = 'INSERT'
  ) into has_orders_client_insert;

  select exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'payment_intents'
      and policyname = 'Clients insert own payment intents' and cmd = 'INSERT'
  ) into has_payment_intent_client_insert;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'services' and column_name = 'includes'
  ) into has_services_includes;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'services' and column_name = 'faq'
  ) into has_services_faq;

  select coalesce(
    (
      select c.reloptions @> array['security_invoker=true']
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = 'participant_profiles'
    ),
    false
  ) into participant_view_invoker;

  result := jsonb_build_object(
    'profiles_insert_guard_trigger', has_profile_guard,
    'rate_limit_hits_table', has_rate_limit_table,
    'profiles_rls_enabled', coalesce(profiles_rls, false),
    'vacancy_applications_guard_trigger', has_vacancy_app_guard,
    'project_applications_guard_trigger', has_project_app_guard,
    'service_moderation_guard_trigger', has_service_mod_guard,
    'participant_profiles_view', has_participant_view,
    'participant_profiles_security_invoker', participant_view_invoker,
    'profiles_order_participant_leak', has_order_participant_leak,
    'payment_intents_client_update', has_payment_intent_client_update,
    'orders_client_insert', has_orders_client_insert,
    'payment_intents_client_insert', has_payment_intent_client_insert,
    'services_includes_column', has_services_includes,
    'services_faq_column', has_services_faq
  );

  return result;
end;
$$;

revoke all on function public.check_launch_readiness() from public;
revoke all on function public.check_launch_readiness() from anon, authenticated;
grant execute on function public.check_launch_readiness() to service_role;

revoke all on function public.guard_project_application_status() from public;
revoke all on function public.guard_project_application_status() from anon, authenticated;
grant execute on function public.guard_project_application_status() to service_role;

revoke all on function public.guard_service_moderation_columns() from public;
revoke all on function public.guard_service_moderation_columns() from anon, authenticated;
grant execute on function public.guard_service_moderation_columns() to service_role;
