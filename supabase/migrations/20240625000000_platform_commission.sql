-- Platform komissiyasi: escrow release da 10% (1000 bps)

alter table public.orders
  add column if not exists platform_fee integer not null default 0 check (platform_fee >= 0);

alter table public.transactions drop constraint if exists transactions_type_check;
alter table public.transactions add constraint transactions_type_check
  check (type in (
    'payment', 'escrow_hold', 'escrow_release', 'withdrawal', 'refund',
    'referral_bonus', 'platform_commission'
  ));

alter table public.transactions alter column user_id drop not null;

alter table public.transactions drop constraint if exists transactions_user_required_check;
alter table public.transactions add constraint transactions_user_required_check
  check (user_id is not null or type = 'platform_commission');

create or replace function public.release_escrow_rpc(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_balance int;
  v_commission int;
  v_payout int;
  v_bps constant int := 1000;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if v_order.payment_status <> 'held' then
    return v_order;
  end if;

  v_commission := (v_order.amount * v_bps) / 10000;
  v_payout := v_order.amount - v_commission;
  if v_payout <= 0 then
    raise exception 'INVALID_PAYOUT';
  end if;

  select wallet_balance into v_balance
  from public.profiles where id = v_order.freelancer_id for update;

  update public.profiles
  set wallet_balance = coalesce(v_balance, 0) + v_payout
  where id = v_order.freelancer_id;

  insert into public.transactions (
    order_id, user_id, type, amount, provider, status
  ) values (
    v_order.id, v_order.freelancer_id, 'escrow_release', v_payout, 'platform', 'completed'
  );

  if v_commission > 0 then
    insert into public.transactions (
      order_id, user_id, type, amount, provider, status
    ) values (
      v_order.id, null, 'platform_commission', v_commission, 'platform', 'completed'
    );
  end if;

  update public.orders
  set payment_status = 'released', platform_fee = v_commission, updated_at = now()
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;
