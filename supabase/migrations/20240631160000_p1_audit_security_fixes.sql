-- P1 audit fixes (2026-06-12)
-- 1) participant_profiles: security invoker (Supabase advisor)
-- 2) Revoke anon/authenticated EXECUTE on internal SECURITY DEFINER RPCs

create or replace view public.participant_profiles
with (security_invoker = true) as
select
  id,
  role,
  full_name,
  avatar_url,
  username,
  bio,
  region,
  specialty,
  skills,
  hourly_rate,
  experience_level,
  languages,
  is_verified,
  portfolio_urls,
  created_at
from public.profiles;

revoke all on public.participant_profiles from public;
revoke all on public.participant_profiles from authenticated;
grant select on public.participant_profiles to service_role;

revoke all on function public.get_reviews_aggregate() from public;
revoke all on function public.get_reviews_aggregate() from anon, authenticated;
grant execute on function public.get_reviews_aggregate() to service_role;

revoke all on function public.get_service_category_counts() from public;
revoke all on function public.get_service_category_counts() from anon, authenticated;
grant execute on function public.get_service_category_counts() to service_role;

revoke all on function public.check_launch_readiness() from public;
revoke all on function public.check_launch_readiness() from anon, authenticated;
grant execute on function public.check_launch_readiness() to service_role;

revoke all on function public.check_username_available(text, uuid) from public;
revoke all on function public.check_username_available(text, uuid) from anon, authenticated;
grant execute on function public.check_username_available(text, uuid) to service_role;

revoke all on function public.guard_vacancy_application_status() from public;
revoke all on function public.guard_vacancy_application_status() from anon, authenticated;
grant execute on function public.guard_vacancy_application_status() to service_role;
