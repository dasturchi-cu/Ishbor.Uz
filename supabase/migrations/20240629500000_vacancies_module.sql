-- Vacancies / jobs module (feature flag: vacancies)

create table if not exists public.vacancies (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) >= 3),
  description text,
  region text,
  employment_type text not null default 'full_time'
    check (employment_type in ('full_time', 'part_time', 'contract', 'internship')),
  salary_min bigint check (salary_min is null or salary_min >= 0),
  salary_max bigint check (salary_max is null or salary_max >= 0),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vacancies_published_idx
  on public.vacancies (is_published, created_at desc);

alter table public.vacancies enable row level security;

drop policy if exists "Published vacancies are public" on public.vacancies;
create policy "Published vacancies are public"
  on public.vacancies for select
  using (is_published = true);

drop policy if exists "Clients manage own vacancies" on public.vacancies;
create policy "Clients manage own vacancies"
  on public.vacancies for all
  using (auth.uid() = client_id)
  with check (auth.uid() = client_id);
