-- TES-6: profiles email/phone faqat egasiga
-- TES-16: notifications jadvali
-- TES-17: saved_items jadvali
-- TES-24: referrals RLS

drop policy if exists "Profiles are viewable by everyone" on public.profiles;

create policy "Users can read own full profile"
  on public.profiles for select
  using (auth.uid() = id);

alter table public.referrals enable row level security;

create policy "Referrers see own referrals"
  on public.referrals for select
  using (auth.uid() = referrer_id);

create policy "Referred user sees own referral"
  on public.referrals for select
  using (auth.uid() = referred_id);

create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, service_id)
);

create index if not exists saved_items_user_id_idx on public.saved_items (user_id);

alter table public.saved_items enable row level security;

create policy "Users manage own saved items"
  on public.saved_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('order', 'message', 'review')),
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "Users see own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);
