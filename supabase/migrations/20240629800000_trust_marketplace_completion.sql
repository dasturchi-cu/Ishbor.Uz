-- Trust & Marketplace completion: escrow auto-release, SLA, ledger, KYC, moderation, terms

-- ─── Enums ───────────────────────────────────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'service_moderation_status') then
    create type public.service_moderation_status as enum ('pending', 'approved', 'rejected');
  end if;
end $$;

-- ─── Terms & consent ─────────────────────────────────────────────────────────
create table if not exists public.terms_documents (
  id uuid primary key default gen_random_uuid(),
  doc_type text not null check (doc_type in ('terms', 'privacy', 'buyer_protection')),
  version text not null,
  title text not null,
  content text not null,
  effective_at timestamptz not null default now(),
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  unique (doc_type, version)
);

create table if not exists public.user_terms_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  doc_type text not null check (doc_type in ('terms', 'privacy', 'buyer_protection')),
  version text not null,
  ip_address text,
  user_agent text,
  accepted_at timestamptz not null default now()
);

create index if not exists user_terms_consents_user_idx
  on public.user_terms_consents (user_id, doc_type, accepted_at desc);

-- ─── Double-entry ledger ─────────────────────────────────────────────────────
create table if not exists public.ledger_accounts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  account_type text not null check (account_type in ('asset', 'liability', 'revenue', 'expense')),
  created_at timestamptz not null default now()
);

insert into public.ledger_accounts (code, name, account_type) values
  ('escrow_hold', 'Escrow held funds', 'liability'),
  ('wallet_freelancer', 'Freelancer wallets', 'liability'),
  ('wallet_client', 'Client wallets', 'liability'),
  ('platform_revenue', 'Platform commission revenue', 'revenue'),
  ('payment_clearing', 'Payment provider clearing', 'asset')
on conflict (code) do nothing;

create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  transaction_group_id uuid not null,
  account_code text not null references public.ledger_accounts (code),
  user_id uuid references public.profiles (id) on delete set null,
  order_id uuid references public.orders (id) on delete set null,
  entry_type text not null check (entry_type in ('debit', 'credit')),
  amount integer not null check (amount > 0),
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ledger_entries_group_idx on public.ledger_entries (transaction_group_id);
create index if not exists ledger_entries_user_idx on public.ledger_entries (user_id, created_at desc);
create index if not exists ledger_entries_order_idx on public.ledger_entries (order_id);

-- ─── Bank accounts & verified withdrawals ────────────────────────────────────
create table if not exists public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  bank_name text not null check (char_length(bank_name) >= 2),
  account_holder text not null,
  account_number text not null check (char_length(account_number) >= 8),
  mfo text,
  is_verified boolean not null default false,
  verified_by uuid references public.profiles (id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bank_accounts_user_idx on public.bank_accounts (user_id);

alter table public.withdrawal_requests
  add column if not exists bank_account_id uuid references public.bank_accounts (id) on delete set null,
  add column if not exists bank_verified_required boolean not null default true;

-- ─── Payment receipts ────────────────────────────────────────────────────────
create table if not exists public.payment_receipts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  client_id uuid not null references public.profiles (id) on delete cascade,
  receipt_number text not null unique,
  amount integer not null check (amount > 0),
  provider text not null,
  provider_ref text,
  pdf_storage_path text,
  emailed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists payment_receipts_order_idx on public.payment_receipts (order_id);

-- ─── Service moderation ──────────────────────────────────────────────────────
alter table public.services
  add column if not exists moderation_status public.service_moderation_status not null default 'approved',
  add column if not exists moderation_notes text,
  add column if not exists moderated_by uuid references public.profiles (id) on delete set null,
  add column if not exists moderated_at timestamptz;

update public.services set moderation_status = 'approved' where moderation_status is null;

create index if not exists services_moderation_pending_idx
  on public.services (created_at desc)
  where moderation_status = 'pending';

-- ─── Orders: escrow auto-release ─────────────────────────────────────────────
alter table public.orders
  add column if not exists delivered_at timestamptz,
  add column if not exists auto_release_at timestamptz,
  add column if not exists auto_released boolean not null default false;

-- ─── Reviews: verified flag ──────────────────────────────────────────────────
alter table public.reviews
  add column if not exists is_verified boolean not null default false;

update public.reviews r
set is_verified = true
from public.orders o
where r.order_id = o.id and o.status = 'completed';

-- ─── Disputes: SLA ───────────────────────────────────────────────────────────
alter table public.disputes
  add column if not exists sla_deadline_at timestamptz,
  add column if not exists sla_breached boolean not null default false,
  add column if not exists sla_hours integer not null default 72;

-- ─── Companies: STIR ─────────────────────────────────────────────────────────
alter table public.companies
  add column if not exists stir text,
  add column if not exists stir_document_url text,
  add column if not exists stir_verified boolean not null default false,
  add column if not exists stir_verified_at timestamptz,
  add column if not exists stir_verified_by uuid references public.profiles (id) on delete set null;

-- ─── Message compliance (off-platform detection) ─────────────────────────────
create table if not exists public.message_compliance_flags (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages (id) on delete cascade,
  order_id uuid references public.orders (id) on delete set null,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  flag_type text not null check (flag_type in ('off_platform_payment', 'contact_leak', 'spam')),
  matched_pattern text,
  content_snippet text,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists message_compliance_unresolved_idx
  on public.message_compliance_flags (resolved, created_at desc)
  where resolved = false;

-- ─── Trust breakdown cache ───────────────────────────────────────────────────
alter table public.user_reputation
  add column if not exists trust_breakdown jsonb not null default '{}'::jsonb,
  add column if not exists dispute_count integer not null default 0,
  add column if not exists dispute_lost_count integer not null default 0;

-- ─── Response time: first reply tracking ─────────────────────────────────────
alter table public.orders
  add column if not exists freelancer_first_response_at timestamptz;

-- ─── Ledger posting helper ───────────────────────────────────────────────────
create or replace function public.post_ledger_pair(
  p_group_id uuid,
  p_debit_account text,
  p_credit_account text,
  p_amount integer,
  p_user_id uuid default null,
  p_order_id uuid default null,
  p_description text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_amount <= 0 then
    raise exception 'INVALID_AMOUNT';
  end if;
  insert into public.ledger_entries (
    transaction_group_id, account_code, user_id, order_id, entry_type, amount, description, metadata
  ) values
    (p_group_id, p_debit_account, p_user_id, p_order_id, 'debit', p_amount, p_description, p_metadata),
    (p_group_id, p_credit_account, p_user_id, p_order_id, 'credit', p_amount, p_description, p_metadata);
end;
$$;

-- ─── Enhanced reputation refresh ─────────────────────────────────────────────
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
  v_disputed integer;
  v_success_rate numeric;
  v_earnings bigint;
  v_response_hours numeric;
  v_trust smallint;
  v_dispute_count integer;
  v_dispute_lost integer;
  v_pr_avg numeric;
  v_pr_count integer;
  v_breakdown jsonb;
  v_orders_pts integer;
  v_reviews_pts integer;
  v_success_pts integer;
  v_verify_pts integer;
  v_response_pts integer;
  v_dispute_penalty integer;
begin
  select coalesce(avg(rating)::numeric, 0), count(*)::integer
  into v_avg, v_review_count
  from public.reviews
  where freelancer_id = p_user_id and is_verified = true;

  select coalesce(avg(rating)::numeric, 0), count(*)::integer
  into v_pr_avg, v_pr_count
  from public.project_reviews pr
  join public.contracts c on c.id = pr.contract_id
  where c.freelancer_id = p_user_id;

  if v_pr_count > 0 then
    v_avg := round(((v_avg * v_review_count) + (v_pr_avg * v_pr_count)) / nullif(v_review_count + v_pr_count, 0), 2);
    v_review_count := v_review_count + v_pr_count;
  end if;

  select count(*)::integer into v_completed_orders
  from public.orders where freelancer_id = p_user_id and status = 'completed';

  select count(*)::integer into v_completed_projects
  from public.contracts where freelancer_id = p_user_id and status = 'completed';

  select count(*)::integer,
         count(*) filter (where status = 'cancelled')::integer,
         count(*) filter (where status = 'disputed')::integer
  into v_total_orders, v_cancelled, v_disputed
  from public.orders where freelancer_id = p_user_id;

  if v_total_orders > 0 then
    v_success_rate := round(((v_total_orders - v_cancelled - v_disputed)::numeric / v_total_orders) * 100, 2);
  else
    v_success_rate := 0;
  end if;

  select coalesce(sum(amount), 0)::bigint into v_earnings
  from public.transactions
  where user_id = p_user_id and type in ('escrow_release', 'payment');

  select count(*)::integer into v_dispute_count
  from public.disputes d
  join public.contracts c on c.id = d.contract_id
  where c.freelancer_id = p_user_id or c.client_id = p_user_id;

  select count(*)::integer into v_dispute_lost
  from public.disputes d
  join public.contracts c on c.id = d.contract_id
  where c.freelancer_id = p_user_id and d.status = 'resolved_client';

  select avg(extract(epoch from (fr.created_at - fc.created_at)) / 3600.0)
  into v_response_hours
  from (
    select m.order_id, min(m.created_at) as created_at
    from public.messages m
    join public.orders o on o.id = m.order_id
    where m.sender_id = o.client_id and o.freelancer_id = p_user_id
    group by m.order_id
  ) fc
  join lateral (
    select m.created_at
    from public.messages m
    where m.order_id = fc.order_id
      and m.sender_id = p_user_id
      and m.created_at > fc.created_at
    order by m.created_at
    limit 1
  ) fr on true
  where fc.created_at > now() - interval '90 days';

  v_orders_pts := least(25, v_completed_orders * 2);
  v_reviews_pts := case when v_review_count > 0 then least(40, (v_avg / 5.0) * 40)::integer else 0 end;
  v_success_pts := case
    when v_success_rate >= 95 then 15
    when v_success_rate >= 85 then 10
    when v_success_rate >= 70 then 5
    else 0
  end;
  v_verify_pts := case when exists (
    select 1 from public.profiles where id = p_user_id and is_verified
  ) then 10 else 0 end;
  v_response_pts := case
    when v_response_hours is null then 0
    when v_response_hours <= 1 then 10
    when v_response_hours <= 6 then 7
    when v_response_hours <= 24 then 4
    else 0
  end;
  v_dispute_penalty := least(25, v_dispute_lost * 8 + greatest(0, v_dispute_count - v_dispute_lost) * 2);

  v_trust := least(100, greatest(0,
    v_reviews_pts + v_orders_pts + v_success_pts + v_verify_pts + v_response_pts - v_dispute_penalty
  ));

  v_breakdown := jsonb_build_object(
    'reviews_points', v_reviews_pts,
    'completed_orders_points', v_orders_pts,
    'success_rate_points', v_success_pts,
    'verification_points', v_verify_pts,
    'response_time_points', v_response_pts,
    'dispute_penalty', v_dispute_penalty,
    'avg_rating', round(v_avg, 2),
    'review_count', v_review_count,
    'completed_orders', v_completed_orders,
    'completed_projects', v_completed_projects,
    'success_rate', v_success_rate,
    'response_time_hours', round(v_response_hours, 2),
    'dispute_count', v_dispute_count,
    'dispute_lost_count', v_dispute_lost,
    'is_verified', v_verify_pts > 0
  );

  insert into public.user_reputation (
    user_id, avg_rating, review_count, completed_projects, completed_orders,
    success_rate, response_time_hours, total_earnings, trust_score,
    trust_breakdown, dispute_count, dispute_lost_count, updated_at
  ) values (
    p_user_id, round(v_avg, 2), v_review_count, v_completed_projects, v_completed_orders,
    v_success_rate, round(v_response_hours, 2), v_earnings, v_trust,
    v_breakdown, v_dispute_count, v_dispute_lost, now()
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
    trust_breakdown = excluded.trust_breakdown,
    dispute_count = excluded.dispute_count,
    dispute_lost_count = excluded.dispute_lost_count,
    updated_at = now();
end;
$$;

-- ─── Dispute SLA trigger ─────────────────────────────────────────────────────
create or replace function public.trg_dispute_set_sla()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.sla_deadline_at is null then
    new.sla_deadline_at := new.created_at + (coalesce(new.sla_hours, 72) || ' hours')::interval;
  end if;
  return new;
end;
$$;

drop trigger if exists disputes_set_sla on public.disputes;
create trigger disputes_set_sla
  before insert on public.disputes
  for each row execute function public.trg_dispute_set_sla();

-- ─── Order delivered → auto_release_at ─────────────────────────────────────
create or replace function public.trg_order_delivered_auto_release()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'delivered' and (old.status is distinct from 'delivered') then
    new.delivered_at := coalesce(new.delivered_at, now());
    new.auto_release_at := coalesce(new.auto_release_at, now() + interval '3 days');
  end if;
  return new;
end;
$$;

drop trigger if exists orders_delivered_auto_release on public.orders;
create trigger orders_delivered_auto_release
  before update on public.orders
  for each row execute function public.trg_order_delivered_auto_release();

-- ─── Review verified on insert ───────────────────────────────────────────────
create or replace function public.trg_review_verify()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_status text;
begin
  select status into v_status from public.orders where id = new.order_id;
  new.is_verified := (v_status = 'completed');
  return new;
end;
$$;

drop trigger if exists reviews_verify on public.reviews;
create trigger reviews_verify
  before insert on public.reviews
  for each row execute function public.trg_review_verify();

-- ─── Auto-release escrow RPC ─────────────────────────────────────────────────
create or replace function public.auto_release_escrow_orders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_count integer := 0;
begin
  for v_order in
    select * from public.orders
    where status = 'delivered'
      and payment_status = 'held'
      and auto_release_at is not null
      and auto_release_at <= now()
      and auto_released = false
    for update skip locked
  loop
    perform public.release_escrow_rpc(v_order.id);
    update public.orders
    set status = 'completed', auto_released = true, updated_at = now()
    where id = v_order.id;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- ─── Dispute SLA breach processor ────────────────────────────────────────────
create or replace function public.process_dispute_sla_breaches()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v_count integer;
begin
  update public.disputes
  set sla_breached = true, updated_at = now()
  where status in ('open', 'responded', 'under_review')
    and sla_deadline_at is not null
    and sla_deadline_at < now()
    and sla_breached = false;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ─── Public dispute statistics view ──────────────────────────────────────────
create or replace view public.public_dispute_stats as
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

-- ─── Seed current terms ──────────────────────────────────────────────────────
insert into public.terms_documents (doc_type, version, title, content, is_current)
values
  ('terms', '2026-06-01', 'Foydalanish shartlari', 'IshBor.uz platformasidan foydalanish shartlari.', true),
  ('privacy', '2026-06-01', 'Maxfiylik siyosati', 'Shaxsiy ma''lumotlaringiz himoyasi.', true),
  ('buyer_protection', '2026-06-01', 'Xaridor himoyasi', 'Escrow orqali to''lov himoyasi: pul ish qabul qilinguncha ushlab turiladi.', true)
on conflict (doc_type, version) do nothing;

update public.terms_documents set is_current = false where doc_type = 'terms' and version <> '2026-06-01';
update public.terms_documents set is_current = true where doc_type = 'terms' and version = '2026-06-01';
update public.terms_documents set is_current = false where doc_type = 'privacy' and version <> '2026-06-01';
update public.terms_documents set is_current = true where doc_type = 'privacy' and version = '2026-06-01';
update public.terms_documents set is_current = false where doc_type = 'buyer_protection' and version <> '2026-06-01';
update public.terms_documents set is_current = true where doc_type = 'buyer_protection' and version = '2026-06-01';

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.terms_documents enable row level security;
alter table public.user_terms_consents enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.payment_receipts enable row level security;
alter table public.message_compliance_flags enable row level security;

drop policy if exists "Terms documents public read" on public.terms_documents;
create policy "Terms documents public read"
  on public.terms_documents for select using (true);

drop policy if exists "Users see own consents" on public.user_terms_consents;
create policy "Users see own consents"
  on public.user_terms_consents for select using (auth.uid() = user_id);

drop policy if exists "Users insert own consents" on public.user_terms_consents;
create policy "Users insert own consents"
  on public.user_terms_consents for insert with check (auth.uid() = user_id);

drop policy if exists "Users see own ledger" on public.ledger_entries;
create policy "Users see own ledger"
  on public.ledger_entries for select using (auth.uid() = user_id);

drop policy if exists "Users manage own bank accounts" on public.bank_accounts;
create policy "Users manage own bank accounts"
  on public.bank_accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users see own receipts" on public.payment_receipts;
create policy "Users see own receipts"
  on public.payment_receipts for select using (auth.uid() = client_id);

grant select on public.public_dispute_stats to anon, authenticated;
grant execute on function public.refresh_user_reputation(uuid) to authenticated, service_role;
grant execute on function public.auto_release_escrow_orders() to service_role;
grant execute on function public.process_dispute_sla_breaches() to service_role;
grant execute on function public.post_ledger_pair(uuid, text, text, integer, uuid, uuid, text, jsonb) to service_role;
