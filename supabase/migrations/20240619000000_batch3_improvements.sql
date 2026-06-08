-- Batch 3: service view analytics

alter table public.services
  add column if not exists view_count int not null default 0;

create index if not exists services_view_count_idx on public.services (view_count desc);
