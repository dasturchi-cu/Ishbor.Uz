-- Tasdiqlangan freelancer/identity uchun badge backfill

alter table public.profiles disable trigger guard_privileged_profile_columns;

update public.profiles p
set is_verified = true
from public.user_verifications uv
where uv.user_id = p.id
  and uv.verification_type in ('freelancer', 'identity')
  and uv.status = 'approved'
  and p.is_verified = false;

alter table public.profiles enable trigger guard_privileged_profile_columns;
