-- Public stats: O(n) table scans → SQL aggregates (landing /stats/public)

create or replace function public.get_reviews_aggregate()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'count', count(*)::int,
    'avg_rating', coalesce(round(avg(rating)::numeric, 1), 0)
  )
  from public.reviews;
$$;

create or replace function public.get_service_category_counts()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_object_agg(category, cnt),
    '{}'::jsonb
  )
  from (
    select coalesce(category, 'other') as category, count(*)::int as cnt
    from public.services
    where is_hidden = false
      and moderation_status = 'approved'
    group by 1
  ) grouped;
$$;

revoke all on function public.get_reviews_aggregate() from public;
grant execute on function public.get_reviews_aggregate() to service_role;

revoke all on function public.get_service_category_counts() from public;
grant execute on function public.get_service_category_counts() to service_role;
