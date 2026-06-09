-- Hamyondan to'lov: payment_status=held bilan status=active

create or replace function public.pay_order_from_wallet_rpc(
  p_order_id uuid,
  p_client_id uuid
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_balance integer;
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

  select wallet_balance into v_balance
  from public.profiles
  where id = p_client_id
  for update;

  if coalesce(v_balance, 0) < v_order.amount then
    raise exception 'INSUFFICIENT_BALANCE';
  end if;

  update public.profiles
  set wallet_balance = wallet_balance - v_order.amount
  where id = p_client_id;

  insert into public.transactions (order_id, user_id, type, amount, provider, status)
  values (v_order.id, p_client_id, 'payment', v_order.amount, 'wallet', 'completed');

  insert into public.transactions (order_id, user_id, type, amount, provider, status)
  values (v_order.id, p_client_id, 'escrow_hold', v_order.amount, 'wallet', 'completed');

  update public.orders
  set payment_status = 'held',
      status = 'active',
      updated_at = now()
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;
