-- Marketplace Escrow System: contracts, milestones, disputes, chat, calls, reviews

-- ─── Enums ───────────────────────────────────────────────────────────────────

alter type public.project_status add value if not exists 'draft';
alter type public.project_status add value if not exists 'in_review';
alter type public.project_status add value if not exists 'accepted';
alter type public.project_status add value if not exists 'active';
alter type public.project_status add value if not exists 'submitted';
alter type public.project_status add value if not exists 'revision_requested';
alter type public.project_status add value if not exists 'completed';
alter type public.project_status add value if not exists 'cancelled';
alter type public.project_status add value if not exists 'disputed';

create type public.contract_status as enum (
  'pending_payment',
  'active',
  'submitted',
  'revision_requested',
  'completed',
  'cancelled',
  'disputed'
);

create type public.milestone_status as enum (
  'pending',
  'funded',
  'submitted',
  'approved',
  'released',
  'cancelled'
);

create type public.dispute_status as enum (
  'open',
  'responded',
  'under_review',
  'resolved_client',
  'resolved_freelancer',
  'closed'
);

create type public.escrow_source_type as enum ('order', 'contract', 'milestone');

create type public.escrow_action as enum (
  'fund',
  'hold',
  'release',
  'refund',
  'partial_release'
);

create type public.conversation_type as enum ('order', 'contract', 'project');

create type public.message_content_type as enum ('text', 'image', 'file', 'document');

create type public.call_type as enum ('one_to_one', 'interview', 'project_discussion');

create type public.call_status as enum (
  'initiated',
  'ringing',
  'active',
  'ended',
  'missed',
  'declined'
);

create type public.project_file_purpose as enum (
  'attachment',
  'deliverable',
  'dispute_evidence',
  'revision'
);

create type public.review_direction as enum ('client_to_freelancer', 'freelancer_to_client');

-- ─── Proposals view (alias) ──────────────────────────────────────────────────

create or replace view public.proposals as
  select * from public.project_applications;

-- ─── Contracts ───────────────────────────────────────────────────────────────

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  proposal_id uuid not null unique references public.project_applications (id) on delete restrict,
  order_id uuid references public.orders (id) on delete set null,
  client_id uuid not null references public.profiles (id) on delete cascade,
  freelancer_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  amount integer not null check (amount > 0),
  deadline date,
  status public.contract_status not null default 'pending_payment',
  payment_status public.payment_status not null default 'unpaid',
  delivery_notes text,
  revision_count integer not null default 0 check (revision_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contracts_project_id_idx on public.contracts (project_id);
create index if not exists contracts_client_id_idx on public.contracts (client_id);
create index if not exists contracts_freelancer_id_idx on public.contracts (freelancer_id);
create index if not exists contracts_status_idx on public.contracts (status);
create index if not exists contracts_client_status_idx on public.contracts (client_id, status);
create index if not exists contracts_freelancer_status_idx on public.contracts (freelancer_id, status);

create trigger contracts_updated_at
  before update on public.contracts
  for each row execute function public.set_updated_at();

-- ─── Escrow transactions ledger ──────────────────────────────────────────────

create table if not exists public.escrow_transactions (
  id uuid primary key default gen_random_uuid(),
  source_type public.escrow_source_type not null,
  source_id uuid not null,
  client_id uuid not null references public.profiles (id) on delete cascade,
  freelancer_id uuid not null references public.profiles (id) on delete cascade,
  amount integer not null check (amount > 0),
  action public.escrow_action not null,
  provider text not null default 'sandbox',
  provider_ref text,
  status text not null default 'completed' check (status in ('pending', 'completed', 'failed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists escrow_tx_source_idx on public.escrow_transactions (source_type, source_id);
create index if not exists escrow_tx_client_idx on public.escrow_transactions (client_id);
create index if not exists escrow_tx_freelancer_idx on public.escrow_transactions (freelancer_id);
create index if not exists escrow_tx_created_idx on public.escrow_transactions (created_at desc);

-- ─── Milestones ──────────────────────────────────────────────────────────────

create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts (id) on delete cascade,
  title text not null,
  description text,
  amount integer not null check (amount > 0),
  due_date date,
  sort_order integer not null default 0,
  status public.milestone_status not null default 'pending',
  payment_status public.payment_status not null default 'unpaid',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists milestones_contract_id_idx on public.milestones (contract_id);
create index if not exists milestones_status_idx on public.milestones (status);

create trigger milestones_updated_at
  before update on public.milestones
  for each row execute function public.set_updated_at();

-- ─── Disputes ────────────────────────────────────────────────────────────────

create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts (id) on delete cascade,
  opened_by uuid not null references public.profiles (id) on delete cascade,
  reason text not null check (char_length(reason) >= 10),
  status public.dispute_status not null default 'open',
  admin_id uuid references public.profiles (id) on delete set null,
  admin_notes text,
  resolution text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists disputes_contract_id_idx on public.disputes (contract_id);
create index if not exists disputes_status_idx on public.disputes (status);
create index if not exists disputes_opened_by_idx on public.disputes (opened_by);

create trigger disputes_updated_at
  before update on public.disputes
  for each row execute function public.set_updated_at();

create table if not exists public.dispute_messages (
  id uuid primary key default gen_random_uuid(),
  dispute_id uuid not null references public.disputes (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) > 0),
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists dispute_messages_dispute_id_idx on public.dispute_messages (dispute_id);

-- ─── Project files ───────────────────────────────────────────────────────────

create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects (id) on delete cascade,
  contract_id uuid references public.contracts (id) on delete cascade,
  uploaded_by uuid not null references public.profiles (id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_type text,
  file_size integer,
  purpose public.project_file_purpose not null default 'attachment',
  created_at timestamptz not null default now(),
  check (project_id is not null or contract_id is not null)
);

create index if not exists project_files_contract_id_idx on public.project_files (contract_id);
create index if not exists project_files_project_id_idx on public.project_files (project_id);

-- ─── Project reviews (bidirectional) ─────────────────────────────────────────

create table if not exists public.project_reviews (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  reviewee_id uuid not null references public.profiles (id) on delete cascade,
  direction public.review_direction not null,
  rating smallint not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (contract_id, reviewer_id)
);

create index if not exists project_reviews_contract_id_idx on public.project_reviews (contract_id);
create index if not exists project_reviews_reviewee_id_idx on public.project_reviews (reviewee_id);

-- ─── Project status history ──────────────────────────────────────────────────

create table if not exists public.project_status_history (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  from_status public.project_status,
  to_status public.project_status not null,
  changed_by uuid references public.profiles (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists project_status_history_project_id_idx
  on public.project_status_history (project_id, created_at desc);

-- ─── Conversations (unified chat) ────────────────────────────────────────────

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  type public.conversation_type not null,
  order_id uuid unique references public.orders (id) on delete cascade,
  contract_id uuid unique references public.contracts (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,
  participant_ids uuid[] not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (type = 'order' and order_id is not null)
    or (type = 'contract' and contract_id is not null)
    or (type = 'project' and project_id is not null)
  )
);

create index if not exists conversations_participants_idx on public.conversations using gin (participant_ids);

create trigger conversations_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

-- Extend messages for unified chat
alter table public.messages
  add column if not exists conversation_id uuid references public.conversations (id) on delete cascade,
  add column if not exists message_type public.message_content_type not null default 'text',
  add column if not exists attachments jsonb not null default '[]'::jsonb;

create index if not exists messages_conversation_id_idx on public.messages (conversation_id, created_at);

-- Make order_id nullable for conversation-only messages (backward compat: existing rows keep order_id)
alter table public.messages alter column order_id drop not null;

-- ─── User presence ───────────────────────────────────────────────────────────

create table if not exists public.user_presence (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  is_online boolean not null default false,
  last_seen_at timestamptz not null default now(),
  typing_in uuid references public.conversations (id) on delete set null
);

-- ─── Call sessions (WebRTC test) ─────────────────────────────────────────────

create table if not exists public.call_sessions (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations (id) on delete set null,
  contract_id uuid references public.contracts (id) on delete set null,
  initiator_id uuid not null references public.profiles (id) on delete cascade,
  callee_id uuid not null references public.profiles (id) on delete cascade,
  call_type public.call_type not null default 'project_discussion',
  status public.call_status not null default 'initiated',
  media_state jsonb not null default '{"camera": true, "mic": true, "screen": false}'::jsonb,
  signaling jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists call_sessions_contract_id_idx on public.call_sessions (contract_id);
create index if not exists call_sessions_participants_idx on public.call_sessions (initiator_id, callee_id);

-- Link orders to projects/contracts
alter table public.orders
  add column if not exists project_id uuid references public.projects (id) on delete set null,
  add column if not exists contract_id uuid references public.contracts (id) on delete set null;

create index if not exists orders_contract_id_idx on public.orders (contract_id);
create index if not exists orders_project_id_idx on public.orders (project_id);

-- ─── Helper: log project status change ───────────────────────────────────────

create or replace function public.log_project_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    insert into public.project_status_history (project_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists projects_status_history on public.projects;
create trigger projects_status_history
  after update of status on public.projects
  for each row execute function public.log_project_status_change();

-- ─── Contract escrow RPCs (sandbox / service role only) ──────────────────────

create or replace function public.fund_contract_escrow_rpc(
  p_contract_id uuid,
  p_client_id uuid,
  p_provider text default 'sandbox',
  p_provider_ref text default null
)
returns public.contracts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contract public.contracts%rowtype;
  v_fee int;
begin
  select * into v_contract from public.contracts where id = p_contract_id for update;
  if not found then
    raise exception 'CONTRACT_NOT_FOUND';
  end if;
  if v_contract.client_id <> p_client_id then
    raise exception 'FORBIDDEN';
  end if;
  if v_contract.status <> 'pending_payment' then
    raise exception 'CONTRACT_NOT_PENDING_PAYMENT';
  end if;
  if v_contract.payment_status = 'held' then
    raise exception 'ALREADY_HELD';
  end if;

  insert into public.escrow_transactions (
    source_type, source_id, client_id, freelancer_id, amount, action, provider, provider_ref
  ) values (
    'contract', p_contract_id, v_contract.client_id, v_contract.freelancer_id,
    v_contract.amount, 'fund', p_provider, p_provider_ref
  );

  insert into public.escrow_transactions (
    source_type, source_id, client_id, freelancer_id, amount, action, provider
  ) values (
    'contract', p_contract_id, v_contract.client_id, v_contract.freelancer_id,
    v_contract.amount, 'hold', p_provider
  );

  insert into public.transactions (
    order_id, user_id, type, amount, provider, provider_ref, status
  ) values (
    v_contract.order_id, p_client_id, 'escrow_hold', v_contract.amount, p_provider, p_provider_ref, 'completed'
  );

  update public.contracts
  set payment_status = 'held', status = 'active', updated_at = now()
  where id = p_contract_id
  returning * into v_contract;

  update public.projects
  set status = 'active', updated_at = now()
  where id = v_contract.project_id and status in ('accepted', 'open', 'in_review');

  return v_contract;
end;
$$;

create or replace function public.release_contract_escrow_rpc(p_contract_id uuid)
returns public.contracts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contract public.contracts%rowtype;
  v_balance int;
  v_fee int;
  v_net int;
begin
  select * into v_contract from public.contracts where id = p_contract_id for update;
  if not found then
    raise exception 'CONTRACT_NOT_FOUND';
  end if;
  if v_contract.payment_status <> 'held' then
    return v_contract;
  end if;

  v_fee := greatest(0, round(v_contract.amount * 0.10));
  v_net := v_contract.amount - v_fee;

  select wallet_balance into v_balance
  from public.profiles where id = v_contract.freelancer_id for update;

  update public.profiles
  set wallet_balance = coalesce(v_balance, 0) + v_net
  where id = v_contract.freelancer_id;

  insert into public.escrow_transactions (
    source_type, source_id, client_id, freelancer_id, amount, action, provider, metadata
  ) values (
    'contract', p_contract_id, v_contract.client_id, v_contract.freelancer_id,
    v_net, 'release', 'platform', jsonb_build_object('platform_fee', v_fee)
  );

  if v_fee > 0 then
    insert into public.transactions (
      order_id, user_id, type, amount, provider, status
    ) values (
      v_contract.order_id, v_contract.freelancer_id, 'platform_commission', v_fee, 'platform', 'completed'
    );
  end if;

  insert into public.transactions (
    order_id, user_id, type, amount, provider, status
  ) values (
    v_contract.order_id, v_contract.freelancer_id, 'escrow_release', v_net, 'platform', 'completed'
  );

  update public.contracts
  set payment_status = 'released', status = 'completed', updated_at = now()
  where id = p_contract_id
  returning * into v_contract;

  update public.projects
  set status = 'completed', updated_at = now()
  where id = v_contract.project_id;

  return v_contract;
end;
$$;

create or replace function public.refund_contract_escrow_rpc(p_contract_id uuid)
returns public.contracts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contract public.contracts%rowtype;
  v_balance int;
begin
  select * into v_contract from public.contracts where id = p_contract_id for update;
  if not found then
    raise exception 'CONTRACT_NOT_FOUND';
  end if;
  if v_contract.payment_status <> 'held' then
    return v_contract;
  end if;

  select wallet_balance into v_balance
  from public.profiles where id = v_contract.client_id for update;

  update public.profiles
  set wallet_balance = coalesce(v_balance, 0) + v_contract.amount
  where id = v_contract.client_id;

  insert into public.escrow_transactions (
    source_type, source_id, client_id, freelancer_id, amount, action, provider
  ) values (
    'contract', p_contract_id, v_contract.client_id, v_contract.freelancer_id,
    v_contract.amount, 'refund', 'platform'
  );

  insert into public.transactions (
    order_id, user_id, type, amount, provider, status
  ) values (
    v_contract.order_id, v_contract.client_id, 'refund', v_contract.amount, 'platform', 'completed'
  );

  update public.contracts
  set payment_status = 'refunded', status = 'cancelled', updated_at = now()
  where id = p_contract_id
  returning * into v_contract;

  return v_contract;
end;
$$;

revoke all on function public.fund_contract_escrow_rpc from public;
revoke all on function public.release_contract_escrow_rpc from public;
revoke all on function public.refund_contract_escrow_rpc from public;

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table public.contracts enable row level security;
alter table public.escrow_transactions enable row level security;
alter table public.milestones enable row level security;
alter table public.disputes enable row level security;
alter table public.dispute_messages enable row level security;
alter table public.project_files enable row level security;
alter table public.project_reviews enable row level security;
alter table public.project_status_history enable row level security;
alter table public.conversations enable row level security;
alter table public.user_presence enable row level security;
alter table public.call_sessions enable row level security;

create policy "Contracts visible to participants"
  on public.contracts for select
  using (auth.uid() = client_id or auth.uid() = freelancer_id);

create policy "Escrow visible to participants"
  on public.escrow_transactions for select
  using (auth.uid() = client_id or auth.uid() = freelancer_id);

create policy "Milestones visible to contract participants"
  on public.milestones for select
  using (
    auth.uid() in (
      select client_id from public.contracts where id = contract_id
      union
      select freelancer_id from public.contracts where id = contract_id
    )
  );

create policy "Disputes visible to participants"
  on public.disputes for select
  using (
    auth.uid() in (
      select client_id from public.contracts where id = contract_id
      union
      select freelancer_id from public.contracts where id = contract_id
    )
    or auth.uid() in (select id from public.profiles where is_admin = true)
  );

create policy "Dispute messages visible to participants"
  on public.dispute_messages for select
  using (
    auth.uid() in (
      select d.opened_by from public.disputes d where d.id = dispute_id
      union
      select c.client_id from public.disputes d join public.contracts c on c.id = d.contract_id where d.id = dispute_id
      union
      select c.freelancer_id from public.disputes d join public.contracts c on c.id = d.contract_id where d.id = dispute_id
    )
    or auth.uid() in (select id from public.profiles where is_admin = true)
  );

create policy "Project files visible to participants"
  on public.project_files for select
  using (
    auth.uid() = uploaded_by
    or (contract_id is not null and auth.uid() in (
      select client_id from public.contracts where id = contract_id
      union select freelancer_id from public.contracts where id = contract_id
    ))
    or (project_id is not null and auth.uid() in (
      select client_id from public.projects where id = project_id
    ))
  );

create policy "Project reviews are public"
  on public.project_reviews for select using (true);

create policy "Project status history visible to project owner"
  on public.project_status_history for select
  using (
    auth.uid() in (select client_id from public.projects where id = project_id)
    or auth.uid() in (
      select pa.freelancer_id from public.project_applications pa
      where pa.project_id = project_status_history.project_id
    )
  );

create policy "Conversations visible to participants"
  on public.conversations for select
  using (auth.uid() = any(participant_ids));

create policy "Presence visible to all authenticated"
  on public.user_presence for select using (true);

create policy "Users update own presence"
  on public.user_presence for update using (auth.uid() = user_id);

create policy "Users insert own presence"
  on public.user_presence for insert with check (auth.uid() = user_id);

create policy "Call sessions visible to participants"
  on public.call_sessions for select
  using (auth.uid() = initiator_id or auth.uid() = callee_id);

-- Realtime
alter table public.conversations replica identity full;
alter table public.dispute_messages replica identity full;
alter table public.call_sessions replica identity full;
alter table public.user_presence replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'call_sessions'
  ) then
    alter publication supabase_realtime add table public.call_sessions;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'user_presence'
  ) then
    alter publication supabase_realtime add table public.user_presence;
  end if;
end $$;
