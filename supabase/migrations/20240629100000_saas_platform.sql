-- IshBor.uz SaaS platform: audit, activity, reputation, verification, reports, drafts, analytics, moderation, fraud, backups, feature flags

-- ─── Profiles extensions ───────────────────────────────────────────────────
alter table public.profiles
  add column if not exists referral_code text,
  add column if not exists is_suspended boolean not null default false,
  add column if not exists suspended_until timestamptz,
  add column if not exists suspension_reason text;

create unique index if not exists profiles_referral_code_unique
  on public.profiles (referral_code)
  where referral_code is not null;

-- Backfill referral codes from username or id prefix
update public.profiles
set referral_code = coalesce(
  nullif(lower(username), ''),
  lower(replace(left(id::text, 8), '-', ''))
)
where referral_code is null;

-- ─── audit_logs ──────────────────────────────────────────────────────────────
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_actor_id_idx on public.audit_logs (actor_id);
create index if not exists audit_logs_action_idx on public.audit_logs (action);
create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);

-- ─── user_activities ───────────────────────────────────────────────────────
create table if not exists public.user_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  activity_type text not null,
  title text not null,
  body text,
  href text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists user_activities_user_id_idx on public.user_activities (user_id, created_at desc);

-- ─── user_reputation ───────────────────────────────────────────────────────
create table if not exists public.user_reputation (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  avg_rating numeric(4, 2) not null default 0,
  review_count integer not null default 0,
  completed_projects integer not null default 0,
  completed_orders integer not null default 0,
  success_rate numeric(5, 2) not null default 0,
  response_time_hours numeric(10, 2),
  total_earnings bigint not null default 0,
  trust_score smallint not null default 0 check (trust_score >= 0 and trust_score <= 100),
  updated_at timestamptz not null default now()
);

-- ─── user_verifications ─────────────────────────────────────────────────────
do $$ begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'verification_type'
  ) then
    create type public.verification_type as enum ('identity', 'freelancer', 'employer', 'company');
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'verification_status'
  ) then
    create type public.verification_status as enum ('pending', 'approved', 'rejected');
  end if;
end $$;

create table if not exists public.user_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  verification_type public.verification_type not null,
  status public.verification_status not null default 'pending',
  document_urls text[] not null default '{}',
  notes text,
  admin_notes text,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_verifications_user_id_idx on public.user_verifications (user_id);
create index if not exists user_verifications_status_idx on public.user_verifications (status);

-- ─── reports ───────────────────────────────────────────────────────────────
do $$ begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'report_category'
  ) then
    create type public.report_category as enum ('scam', 'spam', 'fake_account', 'abuse');
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'report_status'
  ) then
    create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');
  end if;
end $$;

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null,
  target_id text not null,
  category public.report_category not null,
  description text not null check (char_length(description) >= 10),
  status public.report_status not null default 'open',
  assigned_admin_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reports_status_idx on public.reports (status, created_at desc);
create index if not exists reports_target_idx on public.reports (target_type, target_id);

-- ─── report_messages ───────────────────────────────────────────────────────
create table if not exists public.report_messages (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  message text not null check (char_length(message) > 0),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists report_messages_report_id_idx on public.report_messages (report_id, created_at);

-- ─── saved_drafts ──────────────────────────────────────────────────────────
create table if not exists public.saved_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  draft_key text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, draft_key)
);

create index if not exists saved_drafts_user_id_idx on public.saved_drafts (user_id, updated_at desc);

-- ─── analytics_events ──────────────────────────────────────────────────────
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  session_id text,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_name_idx on public.analytics_events (event_name, created_at desc);
create index if not exists analytics_events_user_id_idx on public.analytics_events (user_id, created_at desc);

-- ─── moderation_actions ────────────────────────────────────────────────────
create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles (id) on delete cascade,
  target_user_id uuid references public.profiles (id) on delete set null,
  action text not null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists moderation_actions_admin_idx on public.moderation_actions (admin_id, created_at desc);
create index if not exists moderation_actions_target_idx on public.moderation_actions (target_user_id);

-- ─── fraud_detection_logs ──────────────────────────────────────────────────
create table if not exists public.fraud_detection_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  fraud_type text not null,
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high')),
  details jsonb not null default '{}'::jsonb,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists fraud_detection_logs_user_idx on public.fraud_detection_logs (user_id, created_at desc);
create index if not exists fraud_detection_logs_unresolved_idx on public.fraud_detection_logs (resolved, created_at desc)
  where resolved = false;

-- ─── backups_metadata ────────────────────────────────────────────────────────
create table if not exists public.backups_metadata (
  id uuid primary key default gen_random_uuid(),
  backup_type text not null check (backup_type in ('manual', 'scheduled', 'pre_migration')),
  status text not null default 'completed' check (status in ('in_progress', 'completed', 'failed')),
  storage_path text,
  size_bytes bigint,
  notes text,
  created_at timestamptz not null default now()
);

-- ─── feature_flags ─────────────────────────────────────────────────────────
create table if not exists public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  description text,
  rollout_percent smallint not null default 100 check (rollout_percent >= 0 and rollout_percent <= 100),
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.feature_flags (key, enabled, description) values
  ('marketplace_escrow', true, 'Contract-based escrow marketplace'),
  ('referral_bonus', true, 'Referral bonus on first completed order'),
  ('ai_suggest', true, 'AI description suggestions'),
  ('live_payments', false, 'Click/Payme live payments'),
  ('vacancies', false, 'Jobs/vacancies module')
on conflict (key) do nothing;

-- ─── notifications enrichment (notification center) ──────────────────────────
alter table public.notifications
  add column if not exists category text not null default 'general',
  add column if not exists priority smallint not null default 0;

-- ─── Reputation refresh function ─────────────────────────────────────────────
create or replace function public.refresh_user_reputation(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_avg numeric;
  v_review_count integer;
  v_completed_orders integer;
  v_completed_projects integer;
  v_total_orders integer;
  v_cancelled integer;
  v_success_rate numeric;
  v_earnings bigint;
  v_response_hours numeric;
  v_trust smallint;
begin
  select coalesce(avg(rating)::numeric, 0), count(*)::integer
  into v_avg, v_review_count
  from public.reviews where freelancer_id = p_user_id;

  select count(*)::integer into v_completed_orders
  from public.orders
  where freelancer_id = p_user_id and status = 'completed';

  select count(*)::integer into v_completed_projects
  from public.project_applications
  where freelancer_id = p_user_id and status = 'hired';

  select count(*)::integer, count(*) filter (where status = 'cancelled')::integer
  into v_total_orders, v_cancelled
  from public.orders where freelancer_id = p_user_id;

  if v_total_orders > 0 then
    v_success_rate := round(((v_total_orders - v_cancelled)::numeric / v_total_orders) * 100, 2);
  else
    v_success_rate := 0;
  end if;

  select coalesce(sum(amount), 0)::bigint into v_earnings
  from public.transactions
  where user_id = p_user_id and type in ('escrow_release', 'payment');

  select avg(extract(epoch from (m.read_at - m.created_at)) / 3600.0)
  into v_response_hours
  from public.messages m
  where m.receiver_id = p_user_id and m.read_at is not null
    and m.created_at > now() - interval '90 days';

  v_trust := least(100, greatest(0,
    (case when v_review_count > 0 then least(40, (v_avg / 5.0) * 40) else 0 end)::integer
    + least(25, v_completed_orders * 2)
    + least(15, v_completed_projects * 3)
    + (case when v_success_rate >= 90 then 15 when v_success_rate >= 70 then 8 else 0 end)
    + (case when exists (select 1 from public.profiles where id = p_user_id and is_verified) then 10 else 0 end)
  ));

  insert into public.user_reputation (
    user_id, avg_rating, review_count, completed_projects, completed_orders,
    success_rate, response_time_hours, total_earnings, trust_score, updated_at
  ) values (
    p_user_id, round(v_avg, 2), v_review_count, v_completed_projects, v_completed_orders,
    v_success_rate, round(v_response_hours, 2), v_earnings, v_trust, now()
  )
  on conflict (user_id) do update set
    avg_rating = excluded.avg_rating,
    review_count = excluded.review_count,
    completed_projects = excluded.completed_projects,
    completed_orders = excluded.completed_orders,
    success_rate = excluded.success_rate,
    response_time_hours = excluded.response_time_hours,
    total_earnings = excluded.total_earnings,
    trust_score = excluded.trust_score,
    updated_at = now();
end;
$$;

-- ─── Activity helper ─────────────────────────────────────────────────────────
create or replace function public.record_user_activity(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text default null,
  p_href text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.user_activities (user_id, activity_type, title, body, href, metadata)
  values (p_user_id, p_type, p_title, p_body, p_href, p_metadata)
  returning id into v_id;
  return v_id;
end;
$$;

-- Triggers: reputation + activity on key events
create or replace function public.trg_orders_reputation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'completed' and (old.status is distinct from new.status) then
    perform public.refresh_user_reputation(new.freelancer_id);
    perform public.record_user_activity(
      new.freelancer_id, 'order_completed', 'Buyurtma tugallandi',
      coalesce((select title from public.services where id = new.service_id), 'Buyurtma'),
      '/dashboard/orders/' || new.id::text,
      jsonb_build_object('order_id', new.id, 'amount', new.amount)
    );
    perform public.record_user_activity(
      new.client_id, 'order_completed', 'Buyurtma tugallandi',
      coalesce((select title from public.services where id = new.service_id), 'Buyurtma'),
      '/dashboard/orders/' || new.id::text,
      jsonb_build_object('order_id', new.id)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists orders_reputation_refresh on public.orders;
create trigger orders_reputation_refresh
  after update on public.orders
  for each row execute function public.trg_orders_reputation();

create or replace function public.trg_reviews_reputation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.refresh_user_reputation(new.freelancer_id);
  perform public.record_user_activity(
    new.reviewer_id, 'review_created', 'Sharh qoldirildi',
    new.rating::text || '/5',
    '/dashboard/reviews',
    jsonb_build_object('review_id', new.id, 'rating', new.rating)
  );
  return new;
end;
$$;

drop trigger if exists reviews_reputation_refresh on public.reviews;
create trigger reviews_reputation_refresh
  after insert on public.reviews
  for each row execute function public.trg_reviews_reputation();

create or replace function public.trg_projects_activity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.record_user_activity(
    new.client_id, 'project_created', 'Loyiha yaratildi', new.title,
    '/projects/' || new.id::text,
    jsonb_build_object('project_id', new.id)
  );
  return new;
end;
$$;

drop trigger if exists projects_activity_log on public.projects;
create trigger projects_activity_log
  after insert on public.projects
  for each row execute function public.trg_projects_activity();

-- Fraud: flag duplicate reviews same day same freelancer-reviewer pair
create or replace function public.trg_fraud_review_check()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_dup integer;
begin
  select count(*) into v_dup from public.reviews
  where reviewer_id = new.reviewer_id and freelancer_id = new.freelancer_id
    and created_at > now() - interval '24 hours' and id <> new.id;
  if v_dup > 0 then
    insert into public.fraud_detection_logs (user_id, fraud_type, severity, details)
    values (new.reviewer_id, 'fake_review', 'medium',
      jsonb_build_object('freelancer_id', new.freelancer_id, 'duplicate_count', v_dup));
  end if;
  return new;
end;
$$;

drop trigger if exists fraud_review_check on public.reviews;
create trigger fraud_review_check
  after insert on public.reviews
  for each row execute function public.trg_fraud_review_check();

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.audit_logs enable row level security;
alter table public.user_activities enable row level security;
alter table public.user_reputation enable row level security;
alter table public.user_verifications enable row level security;
alter table public.reports enable row level security;
alter table public.report_messages enable row level security;
alter table public.saved_drafts enable row level security;
alter table public.analytics_events enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.fraud_detection_logs enable row level security;
alter table public.backups_metadata enable row level security;
alter table public.feature_flags enable row level security;

-- audit_logs: admin only via service role; users see own actions
drop policy if exists "Users read own audit logs" on public.audit_logs;
create policy "Users read own audit logs"
  on public.audit_logs for select using (auth.uid() = actor_id);

-- user_activities
drop policy if exists "Users read own activities" on public.user_activities;
create policy "Users read own activities"
  on public.user_activities for select using (auth.uid() = user_id);

-- user_reputation: public read
drop policy if exists "Reputation is public" on public.user_reputation;
create policy "Reputation is public"
  on public.user_reputation for select using (true);

-- user_verifications
drop policy if exists "Users read own verifications" on public.user_verifications;
create policy "Users read own verifications"
  on public.user_verifications for select using (auth.uid() = user_id);
drop policy if exists "Users create own verifications" on public.user_verifications;
create policy "Users create own verifications"
  on public.user_verifications for insert
  with check (auth.uid() = user_id and status = 'pending');

-- reports
drop policy if exists "Users read own reports" on public.reports;
create policy "Users read own reports"
  on public.reports for select using (auth.uid() = reporter_id);
drop policy if exists "Users create reports" on public.reports;
create policy "Users create reports"
  on public.reports for insert with check (auth.uid() = reporter_id);

-- report_messages
drop policy if exists "Reporters read report messages" on public.report_messages;
create policy "Reporters read report messages"
  on public.report_messages for select
  using (
    exists (
      select 1 from public.reports r
      where r.id = report_id and r.reporter_id = auth.uid()
    )
  );
drop policy if exists "Reporters send report messages" on public.report_messages;
create policy "Reporters send report messages"
  on public.report_messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.reports r
      where r.id = report_id and r.reporter_id = auth.uid()
    )
  );

-- saved_drafts
drop policy if exists "Users manage own drafts" on public.saved_drafts;
create policy "Users manage own drafts"
  on public.saved_drafts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- analytics_events: insert own
drop policy if exists "Users insert analytics" on public.analytics_events;
create policy "Users insert analytics"
  on public.analytics_events for insert
  with check (user_id is null or auth.uid() = user_id);

-- feature_flags: public read enabled
drop policy if exists "Feature flags public read" on public.feature_flags;
create policy "Feature flags public read"
  on public.feature_flags for select using (true);

-- Grants for RPC
grant execute on function public.refresh_user_reputation(uuid) to authenticated, service_role;
grant execute on function public.record_user_activity(uuid, text, text, text, text, jsonb) to authenticated, service_role;
