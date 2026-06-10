-- Integration fixes: contract chat RLS, chat PDF MIME, waitlist hardening

-- Messages: allow INSERT for conversation participants (contract/unified chat)
drop policy if exists "Participants can send messages" on public.messages;
create policy "Participants can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and (
      (
        order_id is not null
        and exists (
          select 1 from public.orders o
          where o.id = order_id
            and (o.client_id = auth.uid() or o.freelancer_id = auth.uid())
        )
      )
      or (
        conversation_id is not null
        and exists (
          select 1 from public.conversations c
          where c.id = conversation_id
            and auth.uid() = any (c.participant_ids)
        )
      )
    )
  );

-- Chat PDF uploads in project-attachments bucket
update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
where id = 'project-attachments';

-- Waitlist: backend API uses service_role — block direct anon inserts
drop policy if exists "Waitlist insert service" on public.waitlist_emails;
drop policy if exists "Waitlist insert for authenticated and anon via service" on public.waitlist_emails;

create policy "Waitlist insert service role only"
  on public.waitlist_emails for insert
  to service_role
  with check (true);

revoke insert on public.waitlist_emails from anon;
revoke insert on public.waitlist_emails from authenticated;
