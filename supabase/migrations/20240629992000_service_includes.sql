-- Xizmat "nima kiradi" ro'yxati — freelancer to'ldiradi, platforma shabloni emas

alter table public.services
  add column if not exists includes text[] not null default '{}'::text[];
