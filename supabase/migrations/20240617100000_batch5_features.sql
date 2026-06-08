-- Review replies
alter table public.reviews
  add column if not exists reply text,
  add column if not exists replied_at timestamptz;

-- Order delivery notes
alter table public.orders
  add column if not exists delivery_notes text;

-- Profile view counter
alter table public.profiles
  add column if not exists profile_views int not null default 0,
  add column if not exists onboarding_completed boolean not null default false;
