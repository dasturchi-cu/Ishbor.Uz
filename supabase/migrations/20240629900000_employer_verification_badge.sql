-- Employer tasdiqlanganda ham profil verified belgisi (mavjud yozuvlarni backfill)

alter table public.profiles disable trigger guard_privileged_profile_columns;

update public.profiles p
set is_verified = true
from public.user_verifications uv
where uv.user_id = p.id
  and uv.verification_type = 'employer'
  and uv.status = 'approved'
  and p.is_verified = false;

alter table public.profiles enable trigger guard_privileged_profile_columns;
