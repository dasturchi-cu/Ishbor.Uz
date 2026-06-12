-- RLS initplan optimization for high-traffic tables (auth_rls_initplan advisor)
-- Wrap auth.uid() as (select auth.uid()) to evaluate once per query.

-- profiles
drop policy if exists "Users can read own full profile" on public.profiles;
create policy "Users can read own full profile"
  on public.profiles for select
  using ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using ((select auth.uid()) = id);

-- services (freelancer mutations)
drop policy if exists "Freelancers can insert own services" on public.services;
create policy "Freelancers can insert own services"
  on public.services for insert
  with check ((select auth.uid()) = freelancer_id);

drop policy if exists "Freelancers can update own services" on public.services;
create policy "Freelancers can update own services"
  on public.services for update
  using ((select auth.uid()) = freelancer_id);

drop policy if exists "Freelancers can delete own services" on public.services;
create policy "Freelancers can delete own services"
  on public.services for delete
  using ((select auth.uid()) = freelancer_id);

-- orders
drop policy if exists "Orders visible to participants" on public.orders;
create policy "Orders visible to participants"
  on public.orders for select
  using (
    (select auth.uid()) = client_id
    or (select auth.uid()) = freelancer_id
  );

-- notifications
drop policy if exists "Users see own notifications" on public.notifications;
drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users see own notifications"
  on public.notifications for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications"
  on public.notifications for update
  using ((select auth.uid()) = user_id);

-- payment_intents SELECT
drop policy if exists "Clients read own payment intents" on public.payment_intents;
create policy "Clients read own payment intents"
  on public.payment_intents for select
  using ((select auth.uid()) = client_id);

-- messages receiver update
drop policy if exists "Receiver can mark messages read" on public.messages;
create policy "Receiver can mark messages read"
  on public.messages for update
  using ((select auth.uid()) = receiver_id);
