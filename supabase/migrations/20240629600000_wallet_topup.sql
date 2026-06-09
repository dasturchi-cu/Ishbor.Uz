-- Client wallet top-up (prepaid balance)

create table if not exists public.wallet_topup_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount integer not null check (amount > 0),
  provider text not null check (provider in ('sandbox', 'click', 'payme')),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'succeeded', 'failed', 'cancelled')),
  provider_ref text,
  idempotency_key text unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wallet_topup_intents_user_id_idx
  on public.wallet_topup_intents (user_id, created_at desc);

alter table public.wallet_topup_intents enable row level security;

drop policy if exists wallet_topup_intents_select_own on public.wallet_topup_intents;
create policy wallet_topup_intents_select_own on public.wallet_topup_intents
  for select using (auth.uid() = user_id);

-- Extend transaction types
alter table public.transactions drop constraint if exists transactions_type_check;
alter table public.transactions add constraint transactions_type_check
  check (type in ('payment', 'escrow_hold', 'escrow_release', 'withdrawal', 'refund', 'topup'));

create or replace function public.credit_wallet_topup_rpc(
  p_intent_id uuid,
  p_provider_ref text default null
)
returns public.wallet_topup_intents
language plpgsql
security definer
set search_path = public
as $$
declare
  v_intent public.wallet_topup_intents%rowtype;
begin
  select * into v_intent from public.wallet_topup_intents where id = p_intent_id for update;
  if not found then
    raise exception 'INTENT_NOT_FOUND';
  end if;
  if v_intent.status = 'succeeded' then
    return v_intent;
  end if;
  if v_intent.status not in ('pending', 'processing') then
    raise exception 'INTENT_NOT_CREDITABLE';
  end if;

  update public.profiles
  set wallet_balance = coalesce(wallet_balance, 0) + v_intent.amount
  where id = v_intent.user_id;

  insert into public.transactions (user_id, type, amount, provider, status, order_id)
  values (v_intent.user_id, 'topup', v_intent.amount, v_intent.provider, 'completed', null);

  update public.wallet_topup_intents
  set
    status = 'succeeded',
    provider_ref = coalesce(p_provider_ref, provider_ref),
    updated_at = now()
  where id = p_intent_id
  returning * into v_intent;

  return v_intent;
end;
$$;

revoke all on function public.credit_wallet_topup_rpc(uuid, text) from public;
grant execute on function public.credit_wallet_topup_rpc(uuid, text) to service_role;
