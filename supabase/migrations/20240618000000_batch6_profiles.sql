-- Username, notification prefs, admin ban
alter table public.profiles
  add column if not exists username text,
  add column if not exists is_banned boolean not null default false,
  add column if not exists notification_preferences jsonb not null default '{"emailNewOrders":true,"emailPromotions":false,"smsUrgent":false,"telegramConnect":false}'::jsonb;

create unique index if not exists profiles_username_unique
  on public.profiles (username)
  where username is not null;
