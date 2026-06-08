-- Batch 1: applications, profile fields, project visibility

create type public.application_status as enum ('submitted', 'shortlisted', 'rejected', 'hired');

alter table public.projects
  add column if not exists is_public boolean not null default true;

alter table public.profiles
  add column if not exists skills text[] not null default '{}',
  add column if not exists hourly_rate integer,
  add column if not exists experience_level text,
  add column if not exists languages jsonb not null default '[]'::jsonb;

create table if not exists public.project_applications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  freelancer_id uuid not null references public.profiles (id) on delete cascade,
  cover_letter text not null check (char_length(cover_letter) >= 10),
  proposed_budget integer not null check (proposed_budget > 0),
  proposed_days integer not null default 7 check (proposed_days > 0 and proposed_days <= 365),
  status public.application_status not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, freelancer_id)
);

create index if not exists project_applications_project_id_idx on public.project_applications (project_id);
create index if not exists project_applications_freelancer_id_idx on public.project_applications (freelancer_id);
create index if not exists project_applications_status_idx on public.project_applications (status);

create trigger project_applications_updated_at
  before update on public.project_applications
  for each row execute function public.set_updated_at();

alter table public.project_applications enable row level security;

create policy "Applications visible to participant or project owner"
  on public.project_applications for select
  using (
    auth.uid() = freelancer_id
    or auth.uid() in (select client_id from public.projects where id = project_id)
  );

create policy "Freelancers can apply"
  on public.project_applications for insert
  with check (auth.uid() = freelancer_id);

create policy "Project owner can update application status"
  on public.project_applications for update
  using (
    auth.uid() in (select client_id from public.projects where id = project_id)
  );
