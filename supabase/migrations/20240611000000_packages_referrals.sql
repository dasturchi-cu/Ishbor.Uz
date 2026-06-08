-- IshBor.uz — xizmat paketlari, yetkazish muddati, referral tizimi, qidiruv indeksi

alter table public.services
  add column if not exists delivery_days integer not null default 5 check (delivery_days > 0),
  add column if not exists packages jsonb not null default '[]'::jsonb;

alter table public.profiles
  add column if not exists referred_by uuid references public.profiles (id) on delete set null;

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles (id) on delete cascade,
  referred_id uuid not null unique references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint referrals_no_self check (referrer_id <> referred_id)
);

create index if not exists referrals_referrer_id_idx on public.referrals (referrer_id);
create index if not exists profiles_referred_by_idx on public.profiles (referred_by);

alter table public.orders
  add column if not exists package_id text;

-- Qidiruv tezlashtirish (pg_trgm)
create extension if not exists pg_trgm;

create index if not exists services_title_trgm_idx
  on public.services using gin (title gin_trgm_ops);

create index if not exists services_description_trgm_idx
  on public.services using gin (description gin_trgm_ops);
