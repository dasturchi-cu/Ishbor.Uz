-- Xizmat FAQ — freelancer ixtiyoriy to'ldiradi (platforma shabloni emas)

alter table public.services
  add column if not exists faq jsonb not null default '[]'::jsonb;
