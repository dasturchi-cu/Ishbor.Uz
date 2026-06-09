-- Buyurtma nizolari: disputes jadvaliga order_id

alter table public.disputes
  alter column contract_id drop not null;

alter table public.disputes
  add column if not exists order_id uuid references public.orders (id) on delete cascade;

create index if not exists disputes_order_id_idx on public.disputes (order_id);

alter table public.disputes
  drop constraint if exists disputes_target_check;

alter table public.disputes
  add constraint disputes_target_check
  check (contract_id is not null or order_id is not null);
