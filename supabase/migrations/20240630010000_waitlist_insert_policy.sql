-- Waitlist jadvali (remote DB da yo'q bo'lsa yaratish) + insert policy
create table if not exists public.waitlist_emails (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'general',
  created_at timestamptz not null default now(),
  unique (email, source)
);

create index if not exists waitlist_emails_source_idx on public.waitlist_emails (source);

alter table public.waitlist_emails enable row level security;

drop policy if exists "Waitlist insert for authenticated and anon via service" on public.waitlist_emails;
drop policy if exists "Waitlist not publicly readable" on public.waitlist_emails;
drop policy if exists "Waitlist insert service" on public.waitlist_emails;

create policy "Waitlist insert service"
  on public.waitlist_emails for insert
  with check (true);

create policy "Waitlist not publicly readable"
  on public.waitlist_emails for select
  using (false);

grant insert on public.waitlist_emails to service_role;
grant insert on public.waitlist_emails to anon;
grant insert on public.waitlist_emails to authenticated;
