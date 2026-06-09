-- Sandbox/checkout to'lovdan keyin buyurtma active holatga o'tadi (hamyon to'lovi bilan bir xil).

create or replace function public.hold_escrow_rpc(
  p_order_id uuid,
  p_client_id uuid,
  p_provider text,
  p_provider_ref text default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if v_order.client_id <> p_client_id then
    raise exception 'FORBIDDEN';
  end if;
  if v_order.status <> 'pending' then
    raise exception 'ORDER_NOT_PENDING';
  end if;
  if v_order.payment_status = 'held' then
    raise exception 'ALREADY_HELD';
  end if;

  insert into public.transactions (
    order_id, user_id, type, amount, provider, provider_ref, status
  ) values (
    v_order.id, p_client_id, 'escrow_hold', v_order.amount, p_provider, p_provider_ref, 'completed'
  );

  update public.orders
  set payment_status = 'held',
      status = 'active',
      updated_at = now()
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;
