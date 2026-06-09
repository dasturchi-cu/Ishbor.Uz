# IshBor.uz — Hozir qilinadigan ishlar

**Oxirgi yangilanish:** 2026-06-09 (recovery sprint: run_query + auth race)  
**Cheklov:** Click va Payme integratsiyasi **hozir qilinmaydi** (merchant credential yo‘q). Sandbox hamyon to‘ldirish va `pay-wallet` qoladi.

Ushbu ro‘yxat — UI/API/DB o‘rtasida **yarim ulanmagan** joylar (employer verify kabi). To‘liq production backlog: [production-backlog.md](./production-backlog.md).

---

## P0 — Foydalanuvchi ko‘radigan xatolar / ishonch (1–15)

| # | Vazifa | Fayl / joy | Holat |
|---|--------|------------|-------|
| 1 | Verifikatsiya `rejected` → `is_verified=false` | `backend/app/routers/admin.py` | ✅ |
| 2 | Verify approve/reject — `run_query` + xato handling | `admin.py` verify endpoints | ✅ |
| 3 | Backfill: approved freelancer/identity lekin badge yo‘q | SQL migratsiya | ✅ |
| 4 | Admin bank hisob verify UI | `adminVerifyBankAccount` → yangi admin tab | ✅ |
| 5 | Withdrawal zanjiri: bank verify bo‘lmasa aniq xabar | `wallet-page`, `payments.py` | ✅ |
| 6 | Auth race: order detail, marketplace, bank accounts | `useProtectedLoader` qo‘llash | ✅ |
| 7 | Chat inbox: 3 API merge + duplicate thread | `messages-page`, `unified-chat` | ✅ |
| 8 | `profiles.py` `/me/role` dublikat endpoint | `backend/app/routers/profiles.py` | ✅ |
| 9 | `get_optional_user_id` — barcha ochiq endpointlar | `deps.py` + `public_freelancer_profiles` view | ⚠️ (asosiy endpointlar ✅) |
| 10 | `apiFetch` GET retry + 401 token refresh | `client.ts` | ✅ |
| 11 | Dashboard sahifalar `useAuthReady` | admin + dashboard asosiy sahifalar | ✅ (~99%) |
| 12 | Admin verify tugmasi client (employer) uchun | `admin-page.tsx` | ✅ |
| 13 | Suspend banner — `is_suspended` frontend | yangi `SuspendedBanner` | ✅ |
| 14 | Company verify: bitta kompaniya, `owner_id` emas | `admin.py:1043` | ✅ |
| 15 | Verifikatsiya turlari UI: identity, company | `profile-settings.tsx` | ✅ |

---

## P1 — Admin panel to‘liq ulanish (16–30)

| # | Vazifa | Fayl / joy | Holat |
|---|--------|------------|-------|
| 16 | `adminSuspendUser` UI | `admin-users` yoki user detail | ✅ |
| 17 | Compliance flags resolve tugmasi | `admin-moderation-tabs.tsx` | ✅ |
| 18 | `adminRunTrustJobs` cron trigger | admin settings yoki health | ✅ |
| 19 | Verification UI birlashtirish | `admin-page` + `admin-saas-panel` | ✅ |
| 20 | Admin escrow/status i18n | `admin-escrow-page`, enum kalitlar | ✅ |
| 21 | Admin verification type i18n | `admin-saas-panel`, `admin-verification-queue` | ✅ |
| 22 | Withdrawal status i18n | `admin-page.tsx`, `withdrawal-status.ts` | ✅ |
| 23 | Service moderatsiya: tahrirdan keyin `pending` | `services.py` + admin flow | ✅ |
| 24 | Dispute resolve `run_query` | `admin.py` | ✅ |
| 25 | KYC hujjat ko‘rish (verification `document_urls`) | `admin-verification-queue` | ✅ |
| 26 | User impersonation (support) | reja | ❌ |
| 27 | Audit log export CSV | `admin-dashboard`, `admin-moderation-tabs` | ✅ |
| 28 | Admin revenue charts to‘ldirish | `admin-charts.tsx` + `platform_services.py` | ✅ |
| 29 | Platform health dashboard | `admin-health-panel.tsx` + `/health/ready` | ✅ |
| 30 | Backup restore UI (record only hozir) | `admin-backups-page.tsx` | ✅ |

---

## P1 — Backend barqarorlik `run_query` (31–45)

| # | Router | Taxminiy `.execute()` | Holat |
|---|--------|----------------------|-------|
| 31 | `profiles.py` | ~29 | ✅ |
| 32 | `conversations.py` | ~18 | ✅ |
| 33 | `contracts.py` | ~17 | ✅ |
| 34 | `applications.py` | ~17 | ✅ |
| 35 | `notifications.py` | ~16 | ✅ |
| 36 | `platform.py` | ~15 | ✅ |
| 37 | `projects.py` | ~16 | ✅ |
| 38 | `reviews.py` | ~20 | ✅ |
| 39 | `messages.py` | ~12 | ✅ |
| 40 | `disputes.py` | ~11 | ✅ |
| 41 | `services.py` | ~14 | ✅ |
| 42 | `saved_items.py` | ~19 | ✅ |
| 43 | `trust.py` | ~19 | ✅ |
| 44 | `stats.py` | ~9 | ✅ |
| 45 | `orders.py` (qolgan) | ~5 | ✅ |

---

## P1 — Marketplace & escrow (Click/Payme **tashqari**) (46–58)

| # | Vazifa | Fayl / joy | Holat |
|---|--------|------------|-------|
| 46 | `pay-wallet` → `ensure_order_conversation` | `payments.py` | ✅ |
| 47 | Wallet to‘lov: `orders.status` yangilanishi | RPC + backend | ✅ |
| 48 | Order `disputed` → `disputes` jadvali | `orders.py` | ✅ |
| 49 | Order dispute UI ↔ admin overview | `dashboard-order-detail` | ✅ |
| 50 | Contract review modali | `contract-review-modal`, `contract-detail-page` | ✅ |
| 51 | Milestone `released` escrow bog‘lanishi | `contract-milestones-section` | ✅ |
| 52 | Escrow dashboard status i18n | `escrow-dashboard-page` | ✅ |
| 53 | Contract/dispute status i18n | marketplace pages | ✅ |
| 54 | `publishProject` UI (draft → open) | `post-project.tsx` | ✅ |
| 55 | Hire flow: order `service_id` izchilligi | `contract_service.py`, orders enrich | ✅ |
| 56 | Project status `accepted` va boshqalar UI | `dashboard-projects`, catalog, detail | ✅ |
| 57 | Escrow auto-release monitoring | `admin-moderation-tabs`, `/admin/escrow/auto-releases` | ✅ |
| 58 | JSON order receipt UI | `order-receipt-card`, order detail | ✅ |

---

## P2 — Trust, profil, i18n (59–72)

| # | Vazifa | Fayl / joy | Holat |
|---|--------|------------|-------|
| 59 | STIR submit UI (kompaniya) | `company-stir-section`, settings | ✅ |
| 60 | Trust score breakdown settings da | `profile-settings` security | ✅ |
| 61 | Terms consent login gate | `terms-consent-gate`, `auth-guard` | ✅ |
| 62 | 2FA haqiqiy (TOTP) | `totp-settings-section`, `mfa-totp`, login MFA step | ✅ |
| 63 | Email change flow | `email-change-section`, `account-security` | ✅ |
| 64 | Session management (logout boshqa qurilmalar) | `active-sessions-section`, `signOut({ scope: 'others' })` | ✅ |
| 65 | Portfolio gallery to‘liq | profil | ✅ |
| 66 | CV builder server draft | `cv-builder-page` + `useServerDraft` | ✅ |
| 67 | Profile public slug | `/freelancer/{username}`, `profiles.py` lookup | ✅ |
| 68 | Hardcode EN: input password toggle | `input.tsx` | ✅ |
| 69 | Hardcode EN: price slider aria | `price-range-slider.tsx` | ✅ |
| 70 | Bank MFO placeholder i18n | `bank-accounts-section` | ✅ |
| 71 | Project/order status to‘liq i18n | dashboard + marketplace | ✅ |
| 72 | Service moderation holati freelancer dashboard | `dashboard-services` | ✅ |

---

## P2 — Modullar & API↔UI (73–85)

| # | Vazifa | Fayl / joy | Holat |
|---|--------|------------|-------|
| 73 | Vacancies create UI + `createVacancy` client | `vacancies-catalog`, `client.ts` | ✅ |
| 74 | Companies owner self-service | `company-self-service-section`, settings | ✅ |
| 75 | Video call chat dan boshlash | `start-video-call`, `messages-page`, `contract-detail` | ✅ |
| 76 | `listLedgerEntries` wallet da | `wallet-page` | ✅ |
| 77 | Wallet topup status polling | `wallet-topup-poll`, `wallet-page` | ✅ |
| 78 | Referral bonus widget | `referral-banner` stats | ✅ |
| 79 | Service packages CRUD UI | `service-packages-editor`, edit/new service | ✅ |
| 80 | Review edit/delete client | `dashboard-reviews`, order detail | ✅ |
| 81 | Activity feed server merge | `GET /platform/activity-feed` | ✅ |
| 82 | Drafts barcha formalar | `post-project`, `cv-builder`, `new-service`, `create-service`, `edit-service` | ✅ |
| 83 | Birja filter + pagination | `projects-catalog` budget + URL + load more | ✅ |
| 84 | Search analytics dashboard | admin top searches + projects track | ✅ |
| 85 | Notification realtime to‘liq | INSERT/UPDATE + debounce | ✅ |

---

## P2 — Chat & duplicate (86–92)

| # | Vazifa | Fayl / joy | Holat |
|---|--------|------------|-------|
| 86 | Bitta message API strategiyasi | `GET /messages/inbox` bundle | ✅ |
| 87 | Conversation + order thread birlashtirish | `conversation_service.py`, `conversations.py` | ✅ |
| 88 | Notification synthetic + DB dedupe | `notifications.py` | ✅ |
| 89 | Messages prefs auth guard | `messages-page` | ✅ |
| 90 | Chat file attachment (private bucket + signed URL) | `chat-attachment-content`, migration | ✅ |
| 91 | Inbox realtime debounce | `use-inbox-realtime` | ✅ |
| 92 | `loadThreadMessages` bitta manba | `load-thread-messages.ts` | ✅ |

---

## P3 — Dashboard UX & performance (93–100)

| # | Vazifa | Fayl / joy | Holat |
|---|--------|------------|-------|
| 93 | Dashboard API batch (bitta overview) | `GET /dashboard/overview` | ✅ |
| 94 | Dashboard breadcrumbs | `dashboard-layout`, `dashboard-breadcrumbs` | ✅ |
| 95 | Client analytics sarflangan | `client-dashboard` (`client_stat_total_spent`) | ✅ |
| 96 | Freelancer earnings forecast | `freelancer-dashboard` | ✅ |
| 97 | Mobile 375px hero KPI | `globals.css` dash-kpi + landing-stats | ✅ |
| 98 | Onboarding → hero progress | `dashboard-hero`, onboarding checklists | ✅ |
| 99 | Empty state illustrations | `empty-state.tsx` gradient rings | ✅ |
| 100 | N+1 messages/conversations backend | `conversations.py` (`_enrich_conversations_batch`) | ✅ |

---

## Click/Payme — HOZIR OLIB TASHLANGAN (keyinroq)

Quyidagilar **ushbu ro‘yxatga kiritilmagan** — merchant credential bo‘lganda alohida sprint:

- Live Click/Payme env va webhook production
- `payment_click_soon` / `payment_payme_soon` UI yoqish
- `footer_payments_soon`, `top_up_coming_soon`, `payment_connect_live_soon`
- Click/Payme checkout provider (`use-payment-checkout`)
- To‘lov hamkorlari logotiplari (`trust_partners_soon`)
- Pro pricing live billing

**Hozir ishlaydi (sandbox):** `POST /payments/wallet/topup`, `POST /payments/orders/{id}/pay-wallet`, escrow simulyatsiyasi.

---

## Xulosa

| Prioritet | Vazifalar | Taxminiy kun |
|-----------|-----------|--------------|
| P0 | 15 | 3–5 kun |
| P1 | 43 | 2–3 hafta |
| P2 | 34 | 2–4 hafta |
| P3 | 8 | 1–2 hafta |

**Jami: 100 ta vazifa** (Click/Payme dan tashqari).

### Tavsiya etilgan sprint tartibi

1. **P0 #1–7** — verify, auth race, chat duplicate (foydalanuvchi xatolari)
2. **P1 #31–45** — `run_query` kritik routerlar (503 kamayadi)
3. **P1 #16–25** — admin panel bo‘sh UI lar
4. **P1 #46–58** — escrow/wallet (sandbox, Click/Payme siz)

---

## Bog‘liq hujjatlar

- [production-backlog.md](./production-backlog.md) — 100 ta umumiy vazifa holati
- [production-recovery-report.md](./production-recovery-report.md) — audit ball
