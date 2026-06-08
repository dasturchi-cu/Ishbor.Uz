-- Batch 5: service moderation (hide from catalog)
alter table public.services
  add column if not exists is_hidden boolean not null default false;

create index if not exists services_public_list_idx
  on public.services (created_at desc)
  where is_hidden = false;
