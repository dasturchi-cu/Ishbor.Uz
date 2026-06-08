-- TOP 21-35 audit: view count atomic, service delete guard

create or replace function public.increment_service_view_count(p_service_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.services
  set view_count = coalesce(view_count, 0) + 1
  where id = p_service_id;
$$;

create or replace function public.increment_profile_view_count(p_profile_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
  set profile_views = coalesce(profile_views, 0) + 1
  where id = p_profile_id;
$$;

revoke all on function public.increment_service_view_count from public;
revoke all on function public.increment_profile_view_count from public;
