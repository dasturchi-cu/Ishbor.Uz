-- Idempotency: takroriy POST so'rovlarni xavfsiz qayta ishlash

create table if not exists public.idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  route text not null,
  request_hash text not null,
  status_code integer not null check (status_code between 100 and 599),
  response_body jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  unique (idempotency_key, user_id, route)
);

create index if not exists idempotency_keys_expires_idx
  on public.idempotency_keys (expires_at);

alter table public.idempotency_keys enable row level security;
