-- UI preferences (theme, language, timezone) — cross-device sync

alter table public.profiles
  add column if not exists ui_preferences jsonb not null default '{}'::jsonb;

comment on column public.profiles.ui_preferences is 'theme, language, timezone — synced across devices';
