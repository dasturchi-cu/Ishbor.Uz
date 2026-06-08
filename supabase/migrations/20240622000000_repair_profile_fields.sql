-- Repair: batch1 profile columns missing on remote (skills, hourly_rate, experience_level, languages)
alter table public.profiles
  add column if not exists skills text[] not null default '{}',
  add column if not exists hourly_rate integer,
  add column if not exists experience_level text,
  add column if not exists languages jsonb not null default '[]'::jsonb;
