-- Onboarding: trigger o'tkazib yuborgan foydalanuvchi o'z profilini yaratishi mumkin (fallback).
-- Asosiy yo'l: handle_new_user trigger. Bu policy faqat id = auth.uid() INSERT uchun.

drop policy if exists "Users can insert own profile" on public.profiles;

create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- UPDATE policy ga with check qo'shish (o'z profilidan boshqa id ga yozmaslik)
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
