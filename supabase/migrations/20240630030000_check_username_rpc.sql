-- Username mavjudligi — onboarding backend'siz fallback (security definer)

create or replace function public.check_username_available(
  p_username text,
  p_exclude_user_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.profiles
    where username = lower(regexp_replace(trim(p_username), '^@', ''))
      and length(lower(regexp_replace(trim(p_username), '^@', ''))) >= 3
      and (p_exclude_user_id is null or id <> p_exclude_user_id)
  );
$$;

revoke all on function public.check_username_available(text, uuid) from public;
grant execute on function public.check_username_available(text, uuid) to authenticated;
grant execute on function public.check_username_available(text, uuid) to anon;
