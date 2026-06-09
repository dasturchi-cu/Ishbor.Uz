# IshBor.uz — Reja vs Haqiqat (2026-06-09 yangilangan)

> Asosiy reja: [plan.md](./plan.md) | MVP: [mvp.md](./mvp.md) | Agent: [AGENTS.md](./AGENTS.md) | Bootstrap: [.cursor/rules/agent-bootstrap.mdc](./.cursor/rules/agent-bootstrap.mdc)

## Hozirgi holat

| Bo'lim | Holat |
|--------|-------|
| Frontend UI (11+ sahifa) | ✅ ~90% |
| App Router URL | ✅ `/login`, `/services`, `/dashboard`, ... |
| Supabase Auth | ✅ register/login + middleware |
| FastAPI backend | ✅ profiles, services, orders, projects, messages, reviews, admin, escrow |
| Profil saqlash | ✅ Sozlamalar + API |
| Xizmat yaratish | ✅ `/services/create` |
| Buyurtma flow | ✅ pending → active → delivered → completed / disputed |
| Loyiha joylashtirish | ✅ `/post-project` |
| Freelancer profil | ✅ `/freelancer/[id]` |
| Chat (REST + realtime) | ✅ `/messages`, batch inbox API |
| Sharh/reyting | ✅ tugallangan buyurtmadan keyin |
| Admin panel | ✅ `/admin` (is_admin kerak) |
| Terms + Privacy | ✅ `/terms`, `/privacy` |
| SEO | ✅ metadata, sitemap, robots |
| Wallet sandbox | ✅ topup + pay-wallet |
| Escrow simulyatsiyasi | ✅ hold/release/refund (sandbox) |
| To'lov (Click/Payme live) | ⬜ Merchant credential kerak |
| Deploy production | ⬜ |

**Umumiy:** MVP ~75–80% (live to'lovsiz, sandbox ishlaydi)

## Recovery sprint holati (2026-06-09)

| Blok | Holat |
|------|-------|
| Backend `run_query` (kritik routerlar) | ✅ ~95% |
| Auth race (`useAuthReady` / `useProtectedLoader`) | ✅ ~99% |
| Enterprise security migration | ⚠️ `pnpm db:push` kerak |
| Build + lint | ✅ 0 xato |
| Click/Payme live | ⬜ scope tashqari |

Batafsil vazifalar: [docs/actionable-backlog.md](./docs/actionable-backlog.md)

## Dev serverlar

```powershell
pnpm dev:start   # port tozalash + migration + frontend + backend
pnpm dev:all     # faqat frontend (HMR) + backend (--reload)
```

Kod saqlanganda qo'lda restart shart emas — [agent-bootstrap.mdc](./.cursor/rules/agent-bootstrap.mdc) §6.

## Siz qilishingiz kerak (bir martalik)

1. **Supabase** — yangi migrationlar (`20240629940000`, `20240629960000`, `20240629970000`): `pnpm db:push`
2. **Admin** (ixtiyoriy):
   ```sql
   update profiles set is_admin = true where email = 'sizning@email.com';
   ```
3. **Click/Payme live** — merchant credential bo'lganda alohida sprint

## Keyingi bosqich (MVP tartibi bo'yicha)

1. ~~Chat duplicate thread strategiyasi (P0 #7)~~ ✅
2. ~~Admin verification UI birlashtirish (P1 #19)~~ ✅
3. ~~P1 marketplace qolganlari~~ ✅ (hire flow, project status, auto-release)
4. P2 modullar (vacancies ✅, companies ✅, portfolio ✅, referral ✅, topup poll ✅, birja filter ✅, activity feed ✅, packages CRUD ✅, search analytics ✅, chat inbox ✅, notification dedupe ✅, 2FA ✅, email change ✅, session logout ✅, profile slug ✅) + auth race qolganlari
5. ~~P3 dashboard UX (#93–100 ✅)~~ — breadcrumbs, forecast, mobile KPI, onboarding progress, empty state
6. ~~Admin revenue charts + platform health panel (#28–29 ✅)~~
7. ~~Audit log CSV export (#27 ✅)~~
8. ~~Video call chat/contract dan (#75 ✅)~~
9. ~~Backup checkpoint UI (#30 ✅)~~ + enterprise security migration push
10. ~~Chat attachment private bucket (#90 ✅)~~
11. Click yoki Payme **live** integratsiyasi
11. Production deploy (Vercel + Supabase + Railway)
