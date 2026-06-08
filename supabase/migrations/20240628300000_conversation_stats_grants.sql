-- Fix: authenticated users must execute inbox stats RPC; enforce caller = p_user_id

create or replace function public.get_conversation_message_stats(
  p_user_id uuid,
  p_order_ids uuid[]
)
returns table (
  order_id uuid,
  last_content text,
  last_created_at timestamptz,
  unread_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Ruxsat yo''q' using errcode = '42501';
  end if;

  return query
  with last_msgs as (
    select distinct on (m.order_id)
      m.order_id,
      m.content,
      m.created_at
    from public.messages m
    where m.order_id = any (p_order_ids)
    order by m.order_id, m.created_at desc
  ),
  unread as (
    select m.order_id, count(*)::bigint as cnt
    from public.messages m
    where m.order_id = any (p_order_ids)
      and m.receiver_id = p_user_id
      and m.read_at is null
    group by m.order_id
  )
  select
    oid as order_id,
    lm.content as last_content,
    lm.created_at as last_created_at,
    coalesce(u.cnt, 0) as unread_count
  from unnest(p_order_ids) as oid
  left join last_msgs lm on lm.order_id = oid
  left join unread u on u.order_id = oid;
end;
$$;

revoke all on function public.get_conversation_message_stats(uuid, uuid[]) from public;
grant execute on function public.get_conversation_message_stats(uuid, uuid[]) to authenticated;
grant execute on function public.get_conversation_message_stats(uuid, uuid[]) to service_role;
