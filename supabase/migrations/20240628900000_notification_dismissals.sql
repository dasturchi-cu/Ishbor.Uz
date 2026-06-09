-- Bildirishnomalarni yashirish (synthetic va DB)

create table if not exists public.notification_dismissals (
  user_id uuid not null references public.profiles (id) on delete cascade,
  notification_id text not null,
  dismissed_at timestamptz not null default now(),
  primary key (user_id, notification_id)
);

create index if not exists notification_dismissals_user_id_idx
  on public.notification_dismissals (user_id);

alter table public.notification_dismissals enable row level security;

drop policy if exists "Users manage own notification dismissals" on public.notification_dismissals;

create policy "Users manage own notification dismissals"
  on public.notification_dismissals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
