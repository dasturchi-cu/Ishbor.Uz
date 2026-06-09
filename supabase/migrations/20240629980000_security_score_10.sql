-- Security Score 10: security events, phone verify, admin RBAC, immutable financial rows

-- ─── Admin role hierarchy (super_admin > admin > moderator > support) ───────
alter table public.profiles
  add column if not exists admin_role text
    check (admin_role is null or admin_role in ('super_admin', 'admin', 'moderator', 'support'));

update public.profiles
set admin_role = 'admin'
where is_admin = true and admin_role is null;

-- ─── Phone verification ─────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists phone_verified_at timestamptz;

create table if not exists public.phone_verification_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  phone text not null,
  code_hash text not null,
  attempts smallint not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists phone_verification_codes_user_idx
  on public.phone_verification_codes (user_id, created_at desc);

alter table public.phone_verification_codes enable row level security;

-- ─── Security events (login, suspicious, captcha failures) ───────────────────
create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  event_type text not null,
  severity text not null default 'info' check (severity in ('info', 'low', 'medium', 'high', 'critical')),
  ip_address text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists security_events_user_idx on public.security_events (user_id, created_at desc);
create index if not exists security_events_type_idx on public.security_events (event_type, created_at desc);

alter table public.security_events enable row level security;

-- Backend-only tables (service_role)
drop policy if exists "Phone codes service only" on public.phone_verification_codes;
create policy "Phone codes service only"
  on public.phone_verification_codes for all to service_role using (true) with check (true);

drop policy if exists "Security events service only" on public.security_events;
create policy "Security events service only"
  on public.security_events for all to service_role using (true) with check (true);

-- Users read own security events (login history)
drop policy if exists "Users read own security events" on public.security_events;
create policy "Users read own security events"
  on public.security_events for select to authenticated
  using (auth.uid() = user_id);

-- ─── Immutable financial records ─────────────────────────────────────────────
create or replace function public.deny_financial_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'Financial records are immutable';
end;
$$;

drop trigger if exists ledger_entries_immutable on public.ledger_entries;
create trigger ledger_entries_immutable
  before update or delete on public.ledger_entries
  for each row execute function public.deny_financial_mutation();

drop trigger if exists escrow_transactions_immutable on public.escrow_transactions;
create trigger escrow_transactions_immutable
  before update or delete on public.escrow_transactions
  for each row execute function public.deny_financial_mutation();

drop trigger if exists transactions_immutable on public.transactions;
create trigger transactions_immutable
  before update or delete on public.transactions
  for each row execute function public.deny_financial_mutation();

revoke update, delete on public.ledger_entries from authenticated, anon;
revoke update, delete on public.escrow_transactions from authenticated, anon;
revoke update, delete on public.transactions from authenticated, anon;
