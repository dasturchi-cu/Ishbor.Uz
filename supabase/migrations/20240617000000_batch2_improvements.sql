-- Batch 2: saved projects, waitlist backend

create table if not exists public.saved_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, project_id)
);

create index if not exists saved_projects_user_id_idx on public.saved_projects (user_id);

alter table public.saved_projects enable row level security;

create policy "Users manage own saved projects"
  on public.saved_projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.waitlist_emails (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'general',
  created_at timestamptz not null default now(),
  unique (email, source)
);

create index if not exists waitlist_emails_source_idx on public.waitlist_emails (source);

alter table public.waitlist_emails enable row level security;

create policy "Waitlist insert for authenticated and anon via service"
  on public.waitlist_emails for insert
  with check (true);

create policy "Waitlist not publicly readable"
  on public.waitlist_emails for select
  using (false);
