-- To'lov va escrow (MVP bosqichi)

create type public.payment_status as enum ('unpaid', 'held', 'released', 'refunded');

alter table public.orders
  add column if not exists payment_status public.payment_status not null default 'unpaid';

alter table public.profiles
  add column if not exists wallet_balance integer not null default 0 check (wallet_balance >= 0);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders (id) on delete set null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('payment', 'escrow_hold', 'escrow_release', 'withdrawal', 'refund')),
  amount integer not null check (amount > 0),
  provider text,
  provider_ref text,
  status text not null default 'completed' check (status in ('pending', 'completed', 'failed')),
  created_at timestamptz not null default now()
);

create index if not exists transactions_order_id_idx on public.transactions (order_id);
create index if not exists transactions_user_id_idx on public.transactions (user_id);

create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  freelancer_id uuid not null references public.profiles (id) on delete cascade,
  amount integer not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists withdrawal_requests_freelancer_idx on public.withdrawal_requests (freelancer_id);

alter table public.transactions enable row level security;
alter table public.withdrawal_requests enable row level security;

create policy "Users see own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Freelancers see own withdrawal requests"
  on public.withdrawal_requests for select
  using (auth.uid() = freelancer_id);

create policy "Freelancers create withdrawal requests"
  on public.withdrawal_requests for insert
  with check (auth.uid() = freelancer_id);

-- Realtime chat (Supabase Realtime)
alter table public.messages replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
