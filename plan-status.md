# IshBor.uz — Reja vs Haqiqat (2026-06 yangilangan)

> Asosiy reja: [plan.md](./plan.md) | MVP: [mvp.md](./mvp.md)

## Hozirgi holat (yangilangan)

| Bo'lim | Holat |
|--------|-------|
| Frontend UI (11+ sahifa) | ✅ ~90% |
| App Router URL | ✅ `/login`, `/services`, `/dashboard`, ... |
| Supabase Auth | ✅ register/login |
| FastAPI backend | ✅ profiles, services, orders, projects, messages, reviews, admin |
| Profil saqlash | ✅ Sozlamalar + API |
| Xizmat yaratish | ✅ `/services/create` |
| Buyurtma flow | ✅ pending → active → delivered → completed |
| Loyiha joylashtirish | ✅ `/post-project` |
| Freelancer profil | ✅ `/freelancer/[id]` |
| Chat (REST polling) | ✅ `/messages` |
| Sharh/reyting | ✅ tugallangan buyurtmadan keyin |
| Admin panel | ✅ `/admin` (is_admin kerak) |
| Terms + Privacy | ✅ `/terms`, `/privacy` |
| SEO | ✅ metadata, sitemap, robots |
| To'lov (Click/Payme) | ⬜ Keyingi bosqich |
| Escrow to'lov | ⬜ Keyingi bosqich |
| Deploy production | ⬜ |

**Umumiy:** MVP ~70% (to'lovsiz)

## Siz qilishingiz kerak

1. **Supabase SQL Editor** da yangi migration ni ishga tushiring:
   `supabase/migrations/20240608000000_projects_messages_reviews.sql`

2. **Admin** uchun (ixtiyoriy):
   ```sql
   update profiles set is_admin = true where email = 'sizning@email.com';
   ```

3. **Backend** ishga tushiring:
   ```powershell
   cd backend; uvicorn app.main:app --reload --port 8001
   ```

## Keyingi bosqich (to'lov)

- Click yoki Payme integratsiyasi
- Escrow hold/release
- Production deploy (Vercel + Supabase + Railway)
