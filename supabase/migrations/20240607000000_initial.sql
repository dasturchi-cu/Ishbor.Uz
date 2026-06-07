-- IshBor.uz — Supabase schema (profiles, services, orders)

create type public.user_role as enum ('freelancer', 'client');

create type public.order_status as enum (
  'pending',
  'active',
  'delivered',
  'completed',
  'disputed',
  'cancelled'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'freelancer',
  full_name text,
  email text,
  phone text,
  bio text,
  region text,
  specialty text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  freelancer_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null,
  price integer not null check (price > 0),
  category text not null,
  region text not null,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references public.services (id) on delete set null,
  client_id uuid not null references public.profiles (id) on delete cascade,
  freelancer_id uuid not null references public.profiles (id) on delete cascade,
  amount integer not null check (amount > 0),
  status public.order_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index services_freelancer_id_idx on public.services (freelancer_id);
create index services_category_idx on public.services (category);
create index orders_client_id_idx on public.orders (client_id);
create index orders_freelancer_id_idx on public.orders (freelancer_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'freelancer')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.orders enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Services are viewable by everyone"
  on public.services for select
  using (true);

create policy "Freelancers can insert own services"
  on public.services for insert
  with check (auth.uid() = freelancer_id);

create policy "Freelancers can update own services"
  on public.services for update
  using (auth.uid() = freelancer_id);

create policy "Freelancers can delete own services"
  on public.services for delete
  using (auth.uid() = freelancer_id);

create policy "Orders visible to participants"
  on public.orders for select
  using (auth.uid() = client_id or auth.uid() = freelancer_id);

create policy "Clients can create orders"
  on public.orders for insert
  with check (auth.uid() = client_id);

create policy "Participants can update orders"
  on public.orders for update
  using (auth.uid() = client_id or auth.uid() = freelancer_id);
