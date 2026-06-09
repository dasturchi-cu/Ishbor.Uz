-- Persistence hardening: project-linked orders, tighter RLS, review reply policy

-- Link project-based orders to projects
alter table public.orders
  add column if not exists project_id uuid references public.projects (id) on delete set null,
  add column if not exists application_id uuid references public.project_applications (id) on delete set null;

create index if not exists orders_project_id_idx on public.orders (project_id);

-- Services: hide moderated listings from public SELECT
drop policy if exists "Services are viewable by everyone" on public.services;
create policy "Services are viewable when not hidden or owner"
  on public.services for select
  using (is_hidden = false or auth.uid() = freelancer_id);

-- Messages: sender must be order participant
drop policy if exists "Participants can send messages" on public.messages;
create policy "Participants can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.client_id = auth.uid() or o.freelancer_id = auth.uid())
    )
  );

-- Reviews: validate order ownership, completion, and uniqueness on insert
drop policy if exists "Clients can create reviews for own orders" on public.reviews;
create policy "Clients can create reviews for own completed orders"
  on public.reviews for insert
  with check (
    auth.uid() = reviewer_id
    and exists (
      select 1 from public.orders o
      where o.id = order_id
        and o.client_id = auth.uid()
        and o.status = 'completed'
    )
    and not exists (
      select 1 from public.reviews r where r.order_id = order_id
    )
  );

-- Reviews: freelancer can reply; client can edit own review
create policy "Freelancers can reply to own reviews"
  on public.reviews for update
  using (auth.uid() = freelancer_id)
  with check (auth.uid() = freelancer_id);

create policy "Clients can update own reviews"
  on public.reviews for update
  using (auth.uid() = reviewer_id)
  with check (auth.uid() = reviewer_id);

create policy "Clients can delete own reviews"
  on public.reviews for delete
  using (auth.uid() = reviewer_id);

-- Notifications: users can dismiss own notifications
create policy "Users can delete own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- Project applications: freelancer can withdraw (delete) pending applications
create policy "Freelancers can withdraw own applications"
  on public.project_applications for delete
  using (
    auth.uid() = freelancer_id
    and status in ('submitted', 'shortlisted')
  );
