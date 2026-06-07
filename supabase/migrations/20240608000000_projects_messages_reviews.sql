-- Loyihalar, xabarlar, sharhlar, admin flag

create type public.project_status as enum ('open', 'closed', 'in_progress');

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null,
  category text not null,
  skills text[] not null default '{}',
  budget integer not null check (budget > 0),
  budget_type text not null default 'fixed',
  deadline date,
  level text not null default 'intermediate',
  region text not null,
  status public.project_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) > 0),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  freelancer_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists projects_client_id_idx on public.projects (client_id);
create index if not exists projects_status_idx on public.projects (status);
create index if not exists messages_order_id_idx on public.messages (order_id);
create index if not exists messages_sender_id_idx on public.messages (sender_id);
create index if not exists messages_receiver_id_idx on public.messages (receiver_id);
create index if not exists reviews_freelancer_id_idx on public.reviews (freelancer_id);

create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

alter table public.projects enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;

create policy "Projects are viewable by everyone"
  on public.projects for select using (true);

create policy "Clients can insert own projects"
  on public.projects for insert
  with check (auth.uid() = client_id);

create policy "Clients can update own projects"
  on public.projects for update
  using (auth.uid() = client_id);

create policy "Messages visible to participants"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Participants can send messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);

create policy "Receiver can mark messages read"
  on public.messages for update
  using (auth.uid() = receiver_id);

create policy "Reviews are viewable by everyone"
  on public.reviews for select using (true);

create policy "Clients can create reviews for own orders"
  on public.reviews for insert
  with check (auth.uid() = reviewer_id);
