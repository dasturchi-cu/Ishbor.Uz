# IshBor.uz — Production backlog

Oxirgi yangilanish: 2026-06-09. Dashboard rebuild va SaaS platformadan keyingi qolgan ishlar.

## ✅ Bugun bajarildi

- [x] Merged activity feed (buyurtma + xabar + to'lov + platform activity)
- [x] Client sidebar: Sharhlar + Analitika
- [x] Client sharhlar sahifasi (`/reviews/reviewer/me` API)
- [x] Dark mode dash komponentlari
- [x] Logout da activity/dashboard cache tozalash

---

## P0 — Production bloklari

| # | Vazifa | Qayer |
|---|--------|-------|
| 1 | `supabase db push` — barcha migrationlarni deploy | `supabase/migrations/` |
| 2 | Live Click/Payme env sozlash | `.env`, `backend/` |
| 3 | RLS audit — yangi jadvallar | `20240629100000_saas_platform.sql` |
| 4 | Backend production deploy + health check | `backend/app/main.py` |
| 5 | CORS + rate limit production config | `backend/` |

---

## P1 — Marketplace core

| # | Vazifa |
|---|--------|
| 6 | Escrow milestone RPC UI (`20240629300000_milestone_escrow_rpc.sql`) |
| 7 | Contract detail → to'liq escrow flow |
| 8 | Wallet top-up haqiqiy (hozir toast) |
| 9 | Withdrawal so'rovlar admin tasdiqlash UI |
| 10 | Dispute resolution UI (client + admin) |
| 11 | Order revision flow to'liq |
| 12 | Service packages CRUD UI |
| 13 | Project applications → hire → contract avto |
| 14 | Birja (projects) filter + pagination |
| 15 | Search analytics → dashboard analytics integratsiya |
| 16 | Saved freelancers/services sync |
| 17 | Notification realtime — barcha eventlar |
| 18 | Chat file attachment |
| 19 | Review edit/delete client tomonda ko'rinish |
| 20 | Referral bonus dashboard widget |

---

## P1 — Dashboard & UX

| # | Vazifa |
|---|--------|
| 21 | Admin dashboard redesign (`docs/admin-dashboard-redesign.md`) |
| 22 | Dashboard skeleton → shared loading shell |
| 23 | Onboarding → dashboard hero progress bog'lash |
| 24 | Mobile 375px — hero KPI matn qisqartirish |
| 25 | Dashboard breadcrumbs ichki sahifalar |
| 26 | Empty state illustrations |
| 27 | Keyboard nav sidebar |
| 28 | Dashboard export (CSV) analytics |
| 29 | Client analytics — xizmat ko'rishlari o'rniga sarflangan |
| 30 | Freelancer earnings forecast |

---

## P1 — SaaS platform

| # | Vazifa |
|---|--------|
| 31 | Verification admin approve/reject UI |
| 32 | Report modal — service/project detail |
| 33 | Reputation badge profil + kartochka |
| 34 | Feature flags UI (admin) |
| 35 | Audit log export |
| 36 | Fraud detection alert dashboard |
| 37 | Moderation queue |
| 38 | User suspension UI |
| 39 | Drafts — barcha formalar |
| 40 | Activity feed server-side merge API (optimizatsiya) |

---

## P2 — Auth & profil

| # | Vazifa |
|---|--------|
| 41 | 2FA haqiqiy (hozir toast) |
| 42 | Telefon OTP verifikatsiya |
| 43 | Email change flow |
| 44 | Password strength meter onboarding |
| 45 | OAuth Google/Telegram |
| 46 | Session management (barcha qurilmalar) |
| 47 | Profile portfolio gallery |
| 48 | CV builder → DB persist |
| 49 | UI preferences migration (`20240629200000`) |
| 50 | Profile slug / public URL |

---

## P2 — Kontent & SEO

| # | Vazifa |
|---|--------|
| 51 | Blog CMS (hozir static) |
| 52 | Help center DB + search |
| 53 | Landing A/B test |
| 54 | Sitemap dynamic |
| 55 | Structured data (Service, Review) |
| 56 | OG images per service |
| 57 | i18n missing keys audit |
| 58 | Region filter SEO pages |
| 59 | Pricing page real commission |
| 60 | Terms/Privacy version tracking |

---

## P2 — Admin

| # | Vazifa |
|---|--------|
| 61 | Admin SaaS panel to'liq test |
| 62 | Admin orders bulk actions |
| 63 | Admin user impersonation (audit bilan) |
| 64 | Admin revenue charts |
| 65 | Admin backup restore UI |
| 66 | Admin feature flag rollout % |
| 67 | Admin report triage workflow |
| 68 | Admin KYC document viewer |
| 69 | Admin commission override |
| 70 | Admin platform health dashboard |

---

## P3 — Kelajak modullar

| # | Vazifa |
|---|--------|
| 71 | Vacancies/jobs moduli (feature flag) |
| 72 | Companies B2B |
| 73 | Subscription plans |
| 74 | AI suggest production rate limit |
| 75 | Video call integratsiya |
| 76 | Mobile app (PWA manifest) |
| 77 | Telegram bot notifications |
| 78 | Multi-currency (keyinroq) |
| 79 | Tax invoice PDF |
| 80 | API public docs |

---

## P3 — DevOps & sifat

| # | Vazifa |
|---|--------|
| 81 | E2E Playwright — auth, order, payment |
| 82 | Backend pytest CI |
| 83 | Frontend vitest component tests |
| 84 | Lighthouse CI > 90 |
| 85 | Error tracking (Sentry) |
| 86 | Uptime monitoring |
| 87 | DB backup cron verify |
| 88 | Staging environment |
| 89 | Preview deploy PR |
| 90 | Security headers audit |

---

## P3 — Performance

| # | Vazifa |
|---|--------|
| 91 | Dashboard API batch endpoint |
| 92 | React Query / SWR global cache |
| 93 | Image CDN + WebP |
| 94 | List virtualization (messages, orders) |
| 95 | Service worker offline shell |
| 96 | DB index audit |
| 97 | N+1 query fix messages |
| 98 | Bundle analyze + code split |
| 99 | Edge middleware auth cache |
| 100 | Load test 1k concurrent users |

---

## Deploy tartibi

```bash
# 1. Migration
supabase db push

# 2. Backend
cd backend && uvicorn app.main:app --reload

# 3. Frontend
pnpm build && pnpm start
```

## Tekshiruv checklist

- [ ] `/dashboard` — hero, stats, merged feed
- [ ] `/dashboard/client` — client sidebar Sharhlar/Analitika
- [ ] `/dashboard/reviews` — client yozgan sharhlar
- [ ] Dark mode toggle — dash hero readable
- [ ] 375px — bottom nav, horizontal stats scroll
- [ ] Logout/login — cache toza
