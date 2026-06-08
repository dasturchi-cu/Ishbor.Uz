-- Production hardening: atomic escrow, referral type, safe signup role, view dedup

-- 1) Transaction types: add referral_bonus
alter table public.transactions drop constraint if exists transactions_type_check;
alter table public.transactions add constraint transactions_type_check
  check (type in (
    'payment', 'escrow_hold', 'escrow_release', 'withdrawal', 'refund', 'referral_bonus'
  ));

-- 2) Signup: never trust user-editable metadata for role
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'freelancer'::public.user_role
  );
  return new;
end;
$$;

-- 3) View deduplication (1 view per viewer per target per hour)
create table if not exists public.view_events (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('profile', 'service')),
  target_id uuid not null,
  viewer_key text not null,
  created_at timestamptz not null default now()
);

create index if not exists view_events_dedup_idx
  on public.view_events (target_type, target_id, viewer_key, created_at desc);

alter table public.view_events enable row level security;

-- 4) Atomic escrow RPCs (service role only via backend)
create or replace function public.hold_escrow_rpc(
  p_order_id uuid,
  p_client_id uuid,
  p_provider text,
  p_provider_ref text default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if v_order.client_id <> p_client_id then
    raise exception 'FORBIDDEN';
  end if;
  if v_order.status <> 'pending' then
    raise exception 'ORDER_NOT_PENDING';
  end if;
  if v_order.payment_status = 'held' then
    raise exception 'ALREADY_HELD';
  end if;

  insert into public.transactions (
    order_id, user_id, type, amount, provider, provider_ref, status
  ) values (
    v_order.id, p_client_id, 'escrow_hold', v_order.amount, p_provider, p_provider_ref, 'completed'
  );

  update public.orders
  set payment_status = 'held', updated_at = now()
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

create or replace function public.release_escrow_rpc(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_balance int;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if v_order.payment_status <> 'held' then
    return v_order;
  end if;

  select wallet_balance into v_balance
  from public.profiles where id = v_order.freelancer_id for update;

  update public.profiles
  set wallet_balance = coalesce(v_balance, 0) + v_order.amount
  where id = v_order.freelancer_id;

  insert into public.transactions (
    order_id, user_id, type, amount, provider, status
  ) values (
    v_order.id, v_order.freelancer_id, 'escrow_release', v_order.amount, 'platform', 'completed'
  );

  update public.orders
  set payment_status = 'released', updated_at = now()
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

create or replace function public.refund_escrow_rpc(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_balance int;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if v_order.payment_status <> 'held' then
    return v_order;
  end if;

  select wallet_balance into v_balance
  from public.profiles where id = v_order.client_id for update;

  update public.profiles
  set wallet_balance = coalesce(v_balance, 0) + v_order.amount
  where id = v_order.client_id;

  insert into public.transactions (
    order_id, user_id, type, amount, provider, status
  ) values (
    v_order.id, v_order.client_id, 'refund', v_order.amount, 'platform', 'completed'
  );

  update public.orders
  set payment_status = 'refunded', updated_at = now()
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

create or replace function public.request_withdrawal_rpc(
  p_freelancer_id uuid,
  p_amount int,
  p_note text default null
)
returns public.withdrawal_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance int;
  v_pending int;
  v_row public.withdrawal_requests%rowtype;
begin
  select wallet_balance into v_balance
  from public.profiles where id = p_freelancer_id for update;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  select coalesce(sum(amount), 0) into v_pending
  from public.withdrawal_requests
  where freelancer_id = p_freelancer_id and status = 'pending';

  if p_amount > coalesce(v_balance, 0) - v_pending then
    raise exception 'INSUFFICIENT_BALANCE';
  end if;

  update public.profiles
  set wallet_balance = coalesce(v_balance, 0) - p_amount
  where id = p_freelancer_id;

  insert into public.withdrawal_requests (freelancer_id, amount, note)
  values (p_freelancer_id, p_amount, p_note)
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.reject_withdrawal_rpc(p_request_id uuid)
returns public.withdrawal_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.withdrawal_requests%rowtype;
  v_balance int;
begin
  select * into v_req from public.withdrawal_requests where id = p_request_id for update;
  if not found then
    raise exception 'REQUEST_NOT_FOUND';
  end if;
  if v_req.status <> 'pending' then
    raise exception 'ALREADY_PROCESSED';
  end if;

  select wallet_balance into v_balance
  from public.profiles where id = v_req.freelancer_id for update;

  update public.profiles
  set wallet_balance = coalesce(v_balance, 0) + v_req.amount
  where id = v_req.freelancer_id;

  update public.withdrawal_requests
  set status = 'rejected', updated_at = now()
  where id = p_request_id
  returning * into v_req;

  return v_req;
end;
$$;

create or replace function public.record_view_if_new(
  p_target_type text,
  p_target_id uuid,
  p_viewer_key text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recent timestamptz;
begin
  select created_at into v_recent
  from public.view_events
  where target_type = p_target_type
    and target_id = p_target_id
    and viewer_key = p_viewer_key
    and created_at > now() - interval '1 hour'
  order by created_at desc
  limit 1;

  if v_recent is not null then
    return false;
  end if;

  insert into public.view_events (target_type, target_id, viewer_key)
  values (p_target_type, p_target_id, p_viewer_key);

  return true;
end;
$$;

revoke all on function public.hold_escrow_rpc from public;
revoke all on function public.release_escrow_rpc from public;
revoke all on function public.refund_escrow_rpc from public;
revoke all on function public.request_withdrawal_rpc from public;
revoke all on function public.reject_withdrawal_rpc from public;
revoke all on function public.record_view_if_new from public;
