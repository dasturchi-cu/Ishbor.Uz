-- Loyiha rasmlari + Supabase Storage

alter table public.projects
  add column if not exists attachment_urls text[] not null default '{}';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-attachments',
  'project-attachments',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Project attachments public read" on storage.objects;
drop policy if exists "Auth users upload project attachments" on storage.objects;
drop policy if exists "Users delete own project attachments" on storage.objects;

create policy "Project attachments public read"
  on storage.objects for select
  using (bucket_id = 'project-attachments');

create policy "Auth users upload project attachments"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'project-attachments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users delete own project attachments"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'project-attachments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
