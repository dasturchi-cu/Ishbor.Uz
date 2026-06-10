-- Vacancy applications (freelancer apply to published jobs)

create table if not exists public.vacancy_applications (
  id uuid primary key default gen_random_uuid(),
  vacancy_id uuid not null references public.vacancies (id) on delete cascade,
  freelancer_id uuid not null references public.profiles (id) on delete cascade,
  cover_letter text not null check (char_length(cover_letter) >= 10),
  status text not null default 'submitted'
    check (status in ('submitted', 'reviewed', 'rejected', 'accepted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (vacancy_id, freelancer_id)
);

create index if not exists vacancy_applications_vacancy_idx
  on public.vacancy_applications (vacancy_id, created_at desc);

create index if not exists vacancy_applications_freelancer_idx
  on public.vacancy_applications (freelancer_id, created_at desc);

alter table public.vacancy_applications enable row level security;

drop policy if exists "Freelancers manage own vacancy applications" on public.vacancy_applications;
create policy "Freelancers manage own vacancy applications"
  on public.vacancy_applications for all
  using (auth.uid() = freelancer_id)
  with check (auth.uid() = freelancer_id);

drop policy if exists "Clients read applications on own vacancies" on public.vacancy_applications;
create policy "Clients read applications on own vacancies"
  on public.vacancy_applications for select
  using (
    exists (
      select 1 from public.vacancies v
      where v.id = vacancy_id and v.client_id = auth.uid()
    )
  );
