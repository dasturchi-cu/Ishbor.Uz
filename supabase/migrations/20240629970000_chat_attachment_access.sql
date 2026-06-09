-- Chat attachments: thread ishtirokchilari o'qishi (private project-attachments bucket)

drop policy if exists "Chat attachments read by thread participants" on storage.objects;
create policy "Chat attachments read by thread participants"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'project-attachments'
    and (storage.foldername(name))[2] = 'chat'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or exists (
        select 1
        from public.conversations c
        where c.id::text = (storage.foldername(name))[3]
          and auth.uid() = any (c.participant_ids)
      )
      or exists (
        select 1
        from public.orders o
        where o.id::text = (storage.foldername(name))[3]
          and (auth.uid() = o.client_id or auth.uid() = o.freelancer_id)
      )
    )
  );
