-- Enterprise security audit fixes (2026-06-10)
-- 1. Profile column leak (wallet_balance, PII)
-- 2. Order dispute RLS
-- 3. user_presence scope
-- 4. feature_flags anon access
-- 5. waitlist spam
-- 6. analytics pollution
-- 7. project-attachments bucket privacy

-- ─── Safe freelancer profile view (no wallet_balance / admin flags) ───────────
create or replace view public.public_freelancer_profiles
with (security_invoker = true) as
select
  id,
  role,
  full_name,
  bio,
  region,
  specialty,
  skills,
  hourly_rate,
  experience_level,
  languages,
  avatar_url,
  username,
  is_verified,
  portfolio_urls,
  profile_views,
  referral_code,
  created_at
from public.profiles
where role = 'freelancer'::public.user_role
  and is_banned = false;

grant select on public.public_freelancer_profiles to authenticated;

drop policy if exists "Authenticated users can view freelancer profiles" on public.profiles;

-- ─── Order dispute participant access ───────────────────────────────────────
drop policy if exists "Disputes visible to participants" on public.disputes;
create policy "Disputes visible to participants"
  on public.disputes for select
  using (
    auth.uid() = opened_by
    or auth.uid() in (
      select client_id from public.contracts where id = contract_id
      union
      select freelancer_id from public.contracts where id = contract_id
    )
    or auth.uid() in (
      select client_id from public.orders where id = order_id
      union
      select freelancer_id from public.orders where id = order_id
    )
    or auth.uid() in (select id from public.profiles where is_admin = true)
  );

drop policy if exists "Dispute messages visible to participants" on public.dispute_messages;
create policy "Dispute messages visible to participants"
  on public.dispute_messages for select
  using (
    auth.uid() in (
      select d.opened_by from public.disputes d where d.id = dispute_id
      union
      select c.client_id from public.disputes d
        join public.contracts c on c.id = d.contract_id where d.id = dispute_id
      union
      select c.freelancer_id from public.disputes d
        join public.contracts c on c.id = d.contract_id where d.id = dispute_id
      union
      select o.client_id from public.disputes d
        join public.orders o on o.id = d.order_id where d.id = dispute_id
      union
      select o.freelancer_id from public.disputes d
        join public.orders o on o.id = d.order_id where d.id = dispute_id
    )
    or auth.uid() in (select id from public.profiles where is_admin = true)
  );

-- ─── Presence: conversation participants only ───────────────────────────────
drop policy if exists "Presence visible to all authenticated" on public.user_presence;
create policy "Presence visible to conversation participants"
  on public.user_presence for select to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.conversations c
      where user_presence.user_id = any (c.participant_ids)
        and auth.uid() = any (c.participant_ids)
    )
  );

-- ─── Feature flags: authenticated only, enabled ───────────────────────────────
drop policy if exists "Feature flags public read" on public.feature_flags;
create policy "Feature flags authenticated read"
  on public.feature_flags for select to authenticated
  using (enabled = true);

-- ─── Waitlist: backend-only insert ──────────────────────────────────────────
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'waitlist_emails'
  ) then
    execute 'drop policy if exists "Waitlist insert for authenticated and anon via service" on public.waitlist_emails';
  end if;
end $$;

-- ─── Analytics: authenticated own events only ───────────────────────────────
drop policy if exists "Users insert analytics" on public.analytics_events;
create policy "Users insert own analytics"
  on public.analytics_events for insert to authenticated
  with check (auth.uid() = user_id);

-- ─── Project attachments: private bucket ────────────────────────────────────
update storage.buckets
set public = false
where id = 'project-attachments';

drop policy if exists "Project attachments read by uploader" on storage.objects;
create policy "Project attachments read by uploader"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'project-attachments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
