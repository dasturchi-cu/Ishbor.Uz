-- Profil avatar + xizmat rasmlari + Storage bucketlar

alter table public.profiles
  add column if not exists avatar_url text;

alter table public.services
  add column if not exists image_urls text[] not null default '{}';

-- Avatar bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Xizmat media bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'service-media',
  'service-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Avatars policies
drop policy if exists "Avatars public read" on storage.objects;
drop policy if exists "Auth users upload avatars" on storage.objects;
drop policy if exists "Users update own avatars" on storage.objects;
drop policy if exists "Users delete own avatars" on storage.objects;

create policy "Avatars public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Auth users upload avatars"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users update own avatars"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users delete own avatars"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Service media policies
drop policy if exists "Service media public read" on storage.objects;
drop policy if exists "Auth users upload service media" on storage.objects;
drop policy if exists "Users delete own service media" on storage.objects;

create policy "Service media public read"
  on storage.objects for select
  using (bucket_id = 'service-media');

create policy "Auth users upload service media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'service-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users delete own service media"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'service-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
