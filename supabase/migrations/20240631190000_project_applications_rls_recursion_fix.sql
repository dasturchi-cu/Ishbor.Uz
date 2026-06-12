-- Break RLS recursion: projects SELECT references project_applications,
-- project_applications SELECT references projects → infinite recursion (42P17).

create or replace function public.is_project_client(p_project_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.projects
    where id = p_project_id
      and client_id = p_user_id
  );
$$;

revoke all on function public.is_project_client(uuid, uuid) from public;
grant execute on function public.is_project_client(uuid, uuid) to authenticated, service_role;

create or replace function public.has_project_application(p_project_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.project_applications
    where project_id = p_project_id
      and freelancer_id = p_user_id
  );
$$;

revoke all on function public.has_project_application(uuid, uuid) from public;
grant execute on function public.has_project_application(uuid, uuid) to authenticated, service_role;

-- Projects: applicant check without recursive policy evaluation
drop policy if exists "Projects viewable when public or involved" on public.projects;
create policy "Projects viewable when public or involved"
  on public.projects for select
  using (
    is_public = true
    or auth.uid() = client_id
    or public.has_project_application(id, auth.uid())
  );

-- Project applications: owner check without recursive policy evaluation
drop policy if exists "Applications visible to participant or project owner" on public.project_applications;
create policy "Applications visible to participant or project owner"
  on public.project_applications for select
  using (
    auth.uid() = freelancer_id
    or public.is_project_client(project_id, auth.uid())
  );

drop policy if exists "Project owner can update application status" on public.project_applications;
create policy "Project owner can update application status"
  on public.project_applications for update
  using (public.is_project_client(project_id, auth.uid()));
