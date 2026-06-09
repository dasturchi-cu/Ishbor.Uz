-- Supabase Security Advisor: errors, info (RLS no policy), common warnings

-- ─── 1. Extensions schema (pg_trgm out of public) ───────────────────────────
create schema if not exists extensions;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_trgm') then
    execute 'alter extension pg_trgm set schema extensions';
  else
    execute 'create extension if not exists pg_trgm with schema extensions';
  end if;
end $$;

-- ─── 2. set_updated_at: immutable search_path ───────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── 3. Security invoker views (fix Security Definer View errors) ───────────
create or replace view public.proposals
with (security_invoker = true) as
  select * from public.project_applications;

create or replace view public.public_dispute_stats
with (security_invoker = true) as
select
  count(*)::integer as total_disputes,
  count(*) filter (where status in ('resolved_client', 'resolved_freelancer', 'closed'))::integer as resolved_disputes,
  count(*) filter (where status in ('open', 'responded', 'under_review'))::integer as open_disputes,
  count(*) filter (where sla_breached)::integer as sla_breached_count,
  case when count(*) > 0 then
    round(
      (count(*) filter (where status in ('resolved_client', 'resolved_freelancer', 'closed'))::numeric
        / count(*)::numeric) * 100, 1
    )
  else 100.0 end as resolution_rate_percent
from public.disputes;

revoke all on table public.public_dispute_stats from public;
revoke all on table public.public_dispute_stats from anon, authenticated;
grant select on table public.public_dispute_stats to service_role;

-- ─── 4. RLS policies for backend-only tables (fix RLS Enabled No Policy) ─────
alter table public.backups_metadata enable row level security;
alter table public.fraud_detection_logs enable row level security;
alter table public.idempotency_keys enable row level security;
alter table public.ledger_accounts enable row level security;
alter table public.message_compliance_flags enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.rate_limit_hits enable row level security;
alter table public.view_events enable row level security;

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'backups_metadata',
    'fraud_detection_logs',
    'idempotency_keys',
    'ledger_accounts',
    'message_compliance_flags',
    'moderation_actions',
    'rate_limit_hits',
    'view_events'
  ]
  loop
    execute format('drop policy if exists "Backend service role access" on public.%I', tbl);
    execute format(
      'create policy "Backend service role access" on public.%I for all to service_role using (true) with check (true)',
      tbl
    );
  end loop;
end $$;

-- ─── 5. Storage: public buckets without listing (remove broad SELECT) ─────────
drop policy if exists "Avatars public read" on storage.objects;
drop policy if exists "Service media public read" on storage.objects;
drop policy if exists "Project attachments public read" on storage.objects;

-- Public files remain reachable via /storage/v1/object/public/{bucket}/{path}
-- when bucket.public = true; SELECT policy is not required for direct URLs.

-- ─── 6. SECURITY DEFINER functions: revoke anon/public, grant least privilege ─
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as func
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef = true
      and p.prokind = 'f'
  loop
    execute format('revoke all on function %s from public', r.func);
    execute format('revoke all on function %s from anon', r.func);
    execute format('revoke all on function %s from authenticated', r.func);
    execute format('grant execute on function %s to service_role', r.func);
    execute format('grant execute on function %s to postgres', r.func);
  end loop;
end $$;

-- Authenticated RPCs (backend calls with user JWT)
grant execute on function public.get_conversation_message_stats(uuid, uuid[]) to authenticated;
grant execute on function public.record_view_if_new(text, uuid, text) to authenticated;
grant execute on function public.increment_service_view_count(uuid) to authenticated;
grant execute on function public.increment_profile_view_count(uuid) to authenticated;
