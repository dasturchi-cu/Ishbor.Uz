-- Ensure project_applications RLS when table was created via repair migration

alter table public.project_applications enable row level security;

drop policy if exists "Applications visible to participant or project owner" on public.project_applications;
create policy "Applications visible to participant or project owner"
  on public.project_applications for select
  using (
    auth.uid() = freelancer_id
    or auth.uid() in (select client_id from public.projects where id = project_id)
  );

drop policy if exists "Freelancers can apply" on public.project_applications;
create policy "Freelancers can apply"
  on public.project_applications for insert
  with check (auth.uid() = freelancer_id);

drop policy if exists "Project owner can update application status" on public.project_applications;
create policy "Project owner can update application status"
  on public.project_applications for update
  using (
    auth.uid() in (select client_id from public.projects where id = project_id)
  );
