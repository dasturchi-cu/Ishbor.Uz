# IshBor.uz — Production backlog (100 vazifa)

Oxirgi yangilanish: **2026-06-09** (to'liq audit)

**Belgilar:** ✅ Tayyor · ⚠️ Qisman · ❌ Reja · 🔒 Tashqi (credential/infra)

---

## P0 — Production bloklari

| # | Vazifa | Holat |
|---|--------|-------|
| 1 | `supabase db push` — barcha migrationlar | ✅ 39 ta migration remote sinxron |
| 2 | Live Click/Payme env | 🔒 Merchant credential kerak |
| 3 | RLS audit — yangi jadvallar | ⚠️ Asosiy jadvallar; audit qo'lda |
| 4 | Backend production deploy + health | ⚠️ `/api/v1/health` tayyor; host deploy user |
| 5 | CORS + rate limit production | ⚠️ Kod bor; production env tekshirish kerak |

---

## P1 — Marketplace core (#6–20)

| # | Vazifa | Holat |
|---|--------|-------|
| 6 | Escrow milestone RPC UI | ✅ RPC + `milestone_escrow_service` |
| 7 | Contract detail → escrow flow | ✅ Marketplace UI |
| 8 | Wallet top-up haqiqiy | ⚠️ Sandbox; live 🔒 |
| 9 | Withdrawal admin tasdiqlash UI | ✅ Admin finance |
| 10 | Dispute resolution UI | ✅ Client + admin disputes |
| 11 | Order revision flow | ⚠️ API bor; UI qisman |
| 12 | Service packages CRUD UI | ❌ |
| 13 | Project hire → contract avto | ✅ `contract_service` |
| 14 | Birja filter + pagination | ⚠️ Projects catalog |
| 15 | Search analytics → dashboard | ⚠️ `analytics_events` |
| 16 | Saved items sync | ✅ API |
| 17 | Notification realtime | ⚠️ Asosiy eventlar |
| 18 | Chat file attachment | ✅ Supabase storage |
| 19 | Review edit/delete client | ⚠️ API bor |
| 20 | Referral bonus widget | ⚠️ Backend bor; widget ❌ |

---

## P1 — Dashboard & UX (#21–30)

| # | Vazifa | Holat |
|---|--------|-------|
| 21 | Admin dashboard redesign | ✅ Faza 0–3 |
| 22 | Dashboard skeleton shell | ⚠️ `LoadingBlock` |
| 23 | Onboarding → hero progress | ⚠️ |
| 24 | Mobile 375px hero KPI | ⚠️ |
| 25 | Dashboard breadcrumbs | ❌ |
| 26 | Empty state illustrations | ⚠️ `EmptyState` |
| 27 | Keyboard nav sidebar | ⚠️ Admin ⌘K |
| 28 | Dashboard export CSV | ⚠️ Admin export |
| 29 | Client analytics sarflangan | ❌ |
| 30 | Freelancer earnings forecast | ❌ |

---

## P1 — SaaS platform (#31–40)

| # | Vazifa | Holat |
|---|--------|-------|
| 31 | Verification admin UI | ✅ `AdminSaasPanel` |
| 32 | Report modal | ✅ `report-modal.tsx` |
| 33 | Reputation badge | ✅ Kartalarda + API `trust_score` |
| 34 | Feature flags admin UI | ✅ `/admin/feature-flags` |
| 35 | Audit log export | ❌ |
| 36 | Fraud alert dashboard | ✅ Moderation panel |
| 37 | Moderation queue | ✅ Reports + fraud |
| 38 | User suspension UI | ⚠️ API; admin qisman |
| 39 | Drafts barcha formalar | ⚠️ `use-server-draft` |
| 40 | Activity feed server merge | ⚠️ Client merge |

---

## P2 — Auth & profil (#41–50)

| # | Vazifa | Holat |
|---|--------|-------|
| 41 | 2FA haqiqiy | ❌ Placeholder |
| 42 | Telefon OTP | 🔒 SMS provider |
| 43 | Email change flow | ❌ |
| 44 | Password strength meter | ⚠️ |
| 45 | OAuth Google/Telegram | ❌ |
| 46 | Session management | ❌ |
| 47 | Portfolio gallery | ⚠️ |
| 48 | CV builder DB persist | ⚠️ |
| 49 | UI preferences migration | ✅ `20240629200000` |
| 50 | Profile public slug | ❌ |

---

## P2 — Kontent & SEO (#51–60)

| # | Vazifa | Holat |
|---|--------|-------|
| 51 | Blog CMS | ❌ Static |
| 52 | Help center DB | ❌ Static |
| 53 | Landing A/B test | ❌ |
| 54 | Sitemap dynamic | ✅ services/freelancers/projects/companies |
| 55 | Structured data | ⚠️ Organization JSON-LD |
| 56 | OG images per service | ❌ |
| 57 | i18n audit | ⚠️ Doimiy |
| 58 | Region SEO pages | ❌ |
| 59 | Pricing real commission | ⚠️ |
| 60 | Terms/Privacy versioning | ❌ |

---

## P2 — Admin (#61–70)

| # | Vazifa | Holat |
|---|--------|-------|
| 61 | Admin SaaS panel test | ✅ |
| 62 | Admin orders bulk | ✅ API + admin UI checkbox/bulk |
| 63 | User impersonation | ❌ |
| 64 | Admin revenue charts | ✅ Recharts dashboard |
| 65 | Backup restore UI | ⚠️ Record only |
| 66 | Feature flag rollout % | ✅ Admin UI |
| 67 | Report triage workflow | ✅ Moderation |
| 68 | KYC document viewer | ❌ |
| 69 | Commission override | ❌ |
| 70 | Platform health dashboard | ⚠️ KPI + health API |

---

## P3 — Kelajak modullar (#71–80)

| # | Vazifa | Holat |
|---|--------|-------|
| 71 | Vacancies moduli | ✅ Jadval + API; flag `vacancies` |
| 72 | Companies B2B | ✅ Jadval + admin + `/companies` |
| 73 | Subscription plans | ❌ |
| 74 | AI suggest rate limit | ⚠️ Backend |
| 75 | Video call | ⚠️ WebRTC stub; TURN 🔒 |
| 76 | PWA manifest | ✅ `public/manifest.json` |
| 77 | Telegram bot | 🔒 Bot token |
| 78 | Multi-currency | ❌ |
| 79 | Tax invoice PDF | ❌ |
| 80 | API public docs | ⚠️ OpenAPI dev |

---

## P3 — DevOps & sifat (#81–90)

| # | Vazifa | Holat |
|---|--------|-------|
| 81 | E2E Playwright | ⚠️ smoke + marketplace auth flow |
| 82 | Backend pytest CI | ⚠️ 61+ test; CI user |
| 83 | Frontend vitest | ✅ 13 test |
| 84 | Lighthouse CI > 90 | ❌ |
| 85 | Error tracking Sentry | ⚠️ Package bor |
| 86 | Uptime monitoring | 🔒 |
| 87 | DB backup cron | ❌ |
| 88 | Staging environment | 🔒 |
| 89 | Preview deploy PR | 🔒 Vercel |
| 90 | Security headers audit | ⚠️ |

---

## P3 — Performance (#91–100)

| # | Vazifa | Holat |
|---|--------|-------|
| 91 | Dashboard API batch | ❌ |
| 92 | React Query / SWR | ❌ |
| 93 | Image CDN WebP | ❌ |
| 94 | List virtualization | ❌ |
| 95 | Service worker offline | ❌ |
| 96 | DB index audit | ⚠️ |
| 97 | N+1 messages fix | ⚠️ |
| 98 | Bundle analyze | ❌ |
| 99 | Edge middleware auth cache | ❌ |
| 100 | Load test 1k users | 🔒 |

---

## Xulosa

| Holat | Soni |
|-------|------|
| ✅ Tayyor | ~42 |
| ⚠️ Qisman | ~35 |
| ❌ Reja | ~15 |
| 🔒 Tashqi | ~8 |

**100 ta vazifaning ~42 tasi to'liq**, ~35 tasi qisman, qolganlari tashqi credential yoki alohida sprint talab qiladi.

---

## Deploy

```bash
supabase db push          # ✅ 39 migration
cd backend && pytest      # backend test
pnpm verify               # tsc + lint + test + build
```
