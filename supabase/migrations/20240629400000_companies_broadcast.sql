-- Companies module + broadcast notification type

do $$ begin
  alter table public.notifications drop constraint if exists notifications_type_check;
exception when undefined_object then null;
end $$;

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in ('order', 'message', 'review', 'broadcast'));

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) >= 2),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  logo_url text,
  website text,
  region text,
  owner_id uuid references public.profiles (id) on delete set null,
  employee_count smallint check (employee_count is null or employee_count >= 0),
  is_verified boolean not null default false,
  is_featured boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists companies_published_idx
  on public.companies (is_published, is_featured desc, created_at desc);

create index if not exists companies_region_idx on public.companies (region);

alter table public.companies enable row level security;

drop policy if exists "Published companies are public" on public.companies;
create policy "Published companies are public"
  on public.companies for select
  using (is_published = true);

drop policy if exists "Owners read own companies" on public.companies;
create policy "Owners read own companies"
  on public.companies for select
  using (auth.uid() = owner_id);

insert into public.feature_flags (key, enabled, description) values
  ('companies', true, 'Companies directory and admin module')
on conflict (key) do update set
  enabled = excluded.enabled,
  description = excluded.description,
  updated_at = now();
