-- Click/Payme checkout state machine (Stripe-style payment intents)

create sequence if not exists public.payment_intent_prepare_id_seq;

create table if not exists public.payment_intents (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  client_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null check (provider in ('sandbox', 'click', 'payme')),
  amount integer not null check (amount > 0),
  currency text not null default 'UZS',
  status text not null default 'requires_action'
    check (status in (
      'requires_payment_method',
      'requires_action',
      'processing',
      'succeeded',
      'failed',
      'cancelled'
    )),
  provider_ref text,
  click_trans_id bigint,
  merchant_prepare_id bigint unique,
  idempotency_key text unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_intents_order_id_idx
  on public.payment_intents (order_id, created_at desc);

create index if not exists payment_intents_client_id_idx
  on public.payment_intents (client_id, created_at desc);

create index if not exists payment_intents_active_idx
  on public.payment_intents (order_id, provider)
  where status in ('requires_action', 'processing');

alter table public.payment_intents enable row level security;

create or replace function public.next_payment_prepare_id()
returns bigint
language sql
security definer
set search_path = public
as $$
  select nextval('public.payment_intent_prepare_id_seq');
$$;
