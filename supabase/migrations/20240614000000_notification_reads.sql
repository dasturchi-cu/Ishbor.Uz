-- Bildirishnoma o'qilgan holati (server-side)

create table if not exists public.notification_reads (
  user_id uuid not null references public.profiles (id) on delete cascade,
  notification_id text not null,
  read_at timestamptz not null default now(),
  primary key (user_id, notification_id)
);

create index if not exists notification_reads_user_id_idx on public.notification_reads (user_id);

alter table public.notification_reads enable row level security;

create policy "Users manage own notification reads"
  on public.notification_reads for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
