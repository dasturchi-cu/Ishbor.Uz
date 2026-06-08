-- Batch 4: disputes, verification, portfolio

alter table public.orders
  add column if not exists dispute_reason text;

alter table public.profiles
  add column if not exists is_verified boolean not null default false,
  add column if not exists portfolio_urls text[] not null default '{}';
