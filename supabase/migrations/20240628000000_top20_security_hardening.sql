-- TOP 20 audit: RLS, triggers, payment_intents, withdrawal RPC, rate limits

-- 1) Profile: block privileged column self-escalation
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
  if new.referred_by is distinct from old.referred_by and old.referred_by is not null then
    raise exception 'FORBIDDEN_FIELD: referred_by';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_privileged_profile_columns on public.profiles;
create trigger guard_privileged_profile_columns
  before update on public.profiles
  for each row execute function public.guard_privileged_profile_columns();

-- 2) Orders: participants cannot bypass API escrow logic
drop policy if exists "Participants can update orders" on public.orders;

-- 3) Projects: private drafts not world-readable via direct Supabase
alter table public.projects
  add column if not exists is_public boolean not null default true;

do $$ begin
  create type public.application_status as enum ('submitted', 'shortlisted', 'rejected', 'hired');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.project_applications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  freelancer_id uuid not null references public.profiles (id) on delete cascade,
  cover_letter text not null check (char_length(cover_letter) >= 10),
  proposed_budget integer not null check (proposed_budget > 0),
  proposed_days integer not null default 7 check (proposed_days > 0 and proposed_days <= 365),
  status public.application_status not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, freelancer_id)
);

drop policy if exists "Projects are viewable by everyone" on public.projects;
create policy "Projects viewable when public or involved"
  on public.projects for select
  using (
    is_public = true
    or auth.uid() = client_id
    or exists (
      select 1
      from public.project_applications pa
      where pa.project_id = projects.id
        and pa.freelancer_id = auth.uid()
    )
  );

-- 4) payment_intents: client-scoped access for Click/Payme checkout
drop policy if exists "Clients read own payment intents" on public.payment_intents;
drop policy if exists "Clients insert own payment intents" on public.payment_intents;
drop policy if exists "Clients update own payment intents" on public.payment_intents;

create policy "Clients read own payment intents"
  on public.payment_intents for select
  using (auth.uid() = client_id);

create policy "Clients insert own payment intents"
  on public.payment_intents for insert
  with check (auth.uid() = client_id);

create policy "Clients update own payment intents"
  on public.payment_intents for update
  using (auth.uid() = client_id);

-- 5) Atomic admin withdrawal approval
create or replace function public.approve_withdrawal_rpc(p_request_id uuid)
returns public.withdrawal_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.withdrawal_requests%rowtype;
begin
  select * into v_req from public.withdrawal_requests where id = p_request_id for update;
  if not found then
    raise exception 'REQUEST_NOT_FOUND';
  end if;
  if v_req.status <> 'pending' then
    raise exception 'ALREADY_PROCESSED';
  end if;

  insert into public.transactions (user_id, type, amount, provider, status)
  values (v_req.freelancer_id, 'withdrawal', v_req.amount, 'manual', 'completed');

  update public.withdrawal_requests
  set status = 'approved', updated_at = now()
  where id = p_request_id
  returning * into v_req;

  return v_req;
end;
$$;

revoke all on function public.approve_withdrawal_rpc from public;

-- 6) Persistent rate-limit buckets (service role only)
create table if not exists public.rate_limit_hits (
  id bigserial primary key,
  bucket_key text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_hits_bucket_created_idx
  on public.rate_limit_hits (bucket_key, created_at desc);

alter table public.rate_limit_hits enable row level security;

-- 7) Referral bonus ledger flag
alter table public.referrals
  add column if not exists bonus_credited boolean not null default false;
