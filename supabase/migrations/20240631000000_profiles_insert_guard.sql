-- Profile INSERT: privileged ustunlarni client orqali o'rnatishni bloklash (UPDATE guard kengaytmasi)

create or replace function public.guard_privileged_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if coalesce(new.wallet_balance, 0) <> 0 then
      raise exception 'FORBIDDEN_FIELD: wallet_balance';
    end if;
    if coalesce(new.is_admin, false) then
      raise exception 'FORBIDDEN_FIELD: is_admin';
    end if;
    if coalesce(new.is_banned, false) then
      raise exception 'FORBIDDEN_FIELD: is_banned';
    end if;
    if coalesce(new.is_verified, false) then
      raise exception 'FORBIDDEN_FIELD: is_verified';
    end if;
    return new;
  end if;

  if new.wallet_balance is distinct from old.wallet_balance then
    raise exception 'FORBIDDEN_FIELD: wallet_balance';
  end if;
  if new.is_admin is distinct from old.is_admin then
    raise exception 'FORBIDDEN_FIELD: is_admin';
  end if;
  if new.is_banned is distinct from old.is_banned then
    raise exception 'FORBIDDEN_FIELD: is_banned';
  end if;
  if new.is_verified is distinct from old.is_verified then
    raise exception 'FORBIDDEN_FIELD: is_verified';
  end if;
  if new.referred_by is distinct from old.referred_by and old.referred_by is not null then
    raise exception 'FORBIDDEN_FIELD: referred_by';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_privileged_profile_columns on public.profiles;
create trigger guard_privileged_profile_columns
  before insert or update on public.profiles
  for each row execute function public.guard_privileged_profile_columns();
