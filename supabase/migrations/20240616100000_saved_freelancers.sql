create table if not exists public.saved_freelancers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  freelancer_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, freelancer_id)
);

create index if not exists saved_freelancers_user_id_idx on public.saved_freelancers (user_id);

alter table public.saved_freelancers enable row level security;

drop policy if exists "Users manage own saved freelancers" on public.saved_freelancers;

create policy "Users manage own saved freelancers"
  on public.saved_freelancers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
