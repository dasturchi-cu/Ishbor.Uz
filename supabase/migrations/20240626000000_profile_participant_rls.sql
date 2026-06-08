-- User-scoped API: buyurtma ishtirokchilari va freelancer profillarini o'qish

create policy "Authenticated users can view freelancer profiles"
  on public.profiles for select
  to authenticated
  using (role = 'freelancer'::public.user_role);

create policy "Order participants can view counterpart profile"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1
      from public.orders o
      where (
        o.client_id = auth.uid() and o.freelancer_id = profiles.id
      ) or (
        o.freelancer_id = auth.uid() and o.client_id = profiles.id
      )
    )
  );
