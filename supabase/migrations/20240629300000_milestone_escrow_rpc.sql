-- Milestone escrow RPCs (sandbox / service role)

create or replace function public.fund_milestone_escrow_rpc(
  p_milestone_id uuid,
  p_client_id uuid,
  p_provider text default 'sandbox',
  p_provider_ref text default null
)
returns public.milestones
language plpgsql
security definer
set search_path = public
as $$
declare
  v_milestone public.milestones%rowtype;
  v_contract public.contracts%rowtype;
begin
  select * into v_milestone from public.milestones where id = p_milestone_id for update;
  if not found then
    raise exception 'MILESTONE_NOT_FOUND';
  end if;

  select * into v_contract from public.contracts where id = v_milestone.contract_id;
  if not found then
    raise exception 'CONTRACT_NOT_FOUND';
  end if;
  if v_contract.client_id <> p_client_id then
    raise exception 'FORBIDDEN';
  end if;
  if v_milestone.status <> 'pending' then
    raise exception 'MILESTONE_NOT_PENDING';
  end if;
  if v_milestone.payment_status = 'held' then
    raise exception 'ALREADY_HELD';
  end if;

  insert into public.escrow_transactions (
    source_type, source_id, client_id, freelancer_id, amount, action, provider, provider_ref
  ) values (
    'milestone', p_milestone_id, v_contract.client_id, v_contract.freelancer_id,
    v_milestone.amount, 'fund', p_provider, p_provider_ref
  );

  insert into public.escrow_transactions (
    source_type, source_id, client_id, freelancer_id, amount, action, provider
  ) values (
    'milestone', p_milestone_id, v_contract.client_id, v_contract.freelancer_id,
    v_milestone.amount, 'hold', p_provider
  );

  update public.milestones
  set status = 'funded', payment_status = 'held', updated_at = now()
  where id = p_milestone_id
  returning * into v_milestone;

  return v_milestone;
end;
$$;

create or replace function public.release_milestone_escrow_rpc(p_milestone_id uuid)
returns public.milestones
language plpgsql
security definer
set search_path = public
as $$
declare
  v_milestone public.milestones%rowtype;
  v_contract public.contracts%rowtype;
  v_balance int;
  v_fee int;
  v_net int;
begin
  select * into v_milestone from public.milestones where id = p_milestone_id for update;
  if not found then
    raise exception 'MILESTONE_NOT_FOUND';
  end if;
  if v_milestone.payment_status <> 'held' then
    return v_milestone;
  end if;

  select * into v_contract from public.contracts where id = v_milestone.contract_id;

  v_fee := greatest(0, round(v_milestone.amount * 0.10));
  v_net := v_milestone.amount - v_fee;

  select wallet_balance into v_balance
  from public.profiles where id = v_contract.freelancer_id for update;

  update public.profiles
  set wallet_balance = coalesce(v_balance, 0) + v_net
  where id = v_contract.freelancer_id;

  insert into public.escrow_transactions (
    source_type, source_id, client_id, freelancer_id, amount, action, provider, metadata
  ) values (
    'milestone', p_milestone_id, v_contract.client_id, v_contract.freelancer_id,
    v_net, 'release', 'platform', jsonb_build_object('platform_fee', v_fee)
  );

  if v_fee > 0 and v_contract.order_id is not null then
    insert into public.transactions (
      order_id, user_id, type, amount, provider, status
    ) values (
      v_contract.order_id, v_contract.freelancer_id, 'platform_commission', v_fee, 'platform', 'completed'
    );
  end if;

  if v_contract.order_id is not null then
    insert into public.transactions (
      order_id, user_id, type, amount, provider, status
    ) values (
      v_contract.order_id, v_contract.freelancer_id, 'escrow_release', v_net, 'platform', 'completed'
    );
  end if;

  update public.milestones
  set status = 'released', payment_status = 'released', updated_at = now()
  where id = p_milestone_id
  returning * into v_milestone;

  return v_milestone;
end;
$$;

revoke all on function public.fund_milestone_escrow_rpc from public;
revoke all on function public.release_milestone_escrow_rpc from public;
