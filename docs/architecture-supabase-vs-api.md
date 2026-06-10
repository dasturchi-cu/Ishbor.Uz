# IshBor.uz — Supabase vs Backend API Arxitektura

> **Maqsad:** Frontend va backend integratsiyasini bitta standartga keltirish — production-ready marketplace.
> **Qoida:** Bir feature uchun ikki yo'l ishlatma.
> **Yangilangan:** 2026-06-10

---

## 1. Arxitektura diagrammasi

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                       │
│  UI · Forms · State · Display                                │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
     GROUP A   │                              │  GROUP B
  (ruxsat)    ▼                              ▼  (majburiy)
┌──────────────────────┐          ┌──────────────────────────┐
│ Supabase Client      │          │ api.* → apiFetch         │
│ · auth.*             │          │ FastAPI /api/v1/*        │
│ · storage.upload     │          └────────────┬─────────────┘
│ · realtime subscribe │                       │
└──────────────────────┘                       ▼
                                    ┌──────────────────────────┐
                                    │ Backend (FastAPI)          │
                                    │ Validation · Auth · RPC    │
                                    └────────────┬─────────────┘
                                                 ▼
                                    ┌──────────────────────────┐
                                    │ Supabase PostgreSQL      │
                                    │ RLS · Triggers · RPC     │
                                    └──────────────────────────┘
```

---

## 2. GROUP A — Direct Supabase ruxsat etiladi

| Feature | Frontend yo'l | Nima uchun xavfsiz |
|---------|---------------|-------------------|
| **Login** | `supabase.auth.signInWithPassword` | Parol Supabase Auth da; JWT qaytariladi |
| **Register** | `supabase.auth.signUp` | Faqat auth user yaratiladi |
| **Session** | `session-cache.ts` → `getSession` / `refreshSession` | Token o'qish — business logic yo'q |
| **Logout** | `supabase.auth.signOut` | Sessiya tugatish |
| **Password / MFA / OAuth** | `infrastructure/auth/*` | Supabase Auth API domain |
| **Avatar upload** | `storage.ts` → `avatars/{uid}/` | Storage RLS: faqat o'z papkasi |
| **Media upload** | `storage.ts` → service/project/chat buckets | Xuddi shu RLS qoidasi |
| **Realtime chat** | `use-order-messages-realtime.ts`, `use-conversation-messages-realtime.ts` | Faqat **subscribe**; yuborish API orqali |
| **Realtime notifications** | `use-notifications-realtime.ts` | Faqat **subscribe** → API refetch |
| **Typing / presence subscribe** | `use-order-typing.ts` | Realtime event, yozish API orqali |
| **Public search/listings** *(policy)* | Hozir: `api.listServices` va hokazo | RLS public SELECT mumkin, lekin API filter/moderation uchun tavsiya etiladi |

### GROUP A — kod joylari

| Vazifa | Fayl |
|--------|------|
| Auth client | `src/infrastructure/supabase/client.ts` |
| Session cache | `src/infrastructure/auth/session-cache.ts` |
| Storage upload | `src/infrastructure/supabase/storage.ts` |
| Realtime hooks | `src/shared/lib/use-*-realtime.ts` |
| Login/Register UI | `src/presentation/features/auth/*` |

### GROUP A — qoida

```typescript
// ✅ RUXSAT
supabase.auth.signInWithPassword(...)
supabase.storage.from('avatars').upload(`${userId}/...`, file)
supabase.channel('...').on('postgres_changes', { event: 'INSERT', table: 'messages' }, ...)

// ❌ TAQIQLANADI (GROUP B ga tegishli)
supabase.from('profiles').update(...)
supabase.from('orders').insert(...)
supabase.rpc('hold_escrow_rpc', ...)
```

---

## 3. GROUP B — FAQAT Backend API

Barcha business logic, pul oqimi, ruxsat, trust, moderatsiya va xavfsizlikka taalluqli operatsiyalar.

### Umumiy pattern

```
Frontend form → api.method() → FastAPI router → service layer → Supabase (service_role + RPC)
```

---

## 4. Feature klassifikatsiyasi (to'liq jadval)

| Feature | Direct Supabase | Backend Required | Sabab |
|---------|:---------------:|:----------------:|-------|
| Login / Register / Logout | ✅ Auth | ❌ | JWT lifecycle |
| Session refresh | ✅ | ❌ | Token only |
| Avatar / media upload | ✅ Storage | ✅ metadata | URL + DB fields API orqali |
| Realtime subscribe | ✅ | ❌ | Read-only push |
| Chat xabar yuborish | ❌ | ✅ | Order check, fraud flag |
| Bildirishnoma yaratish | ❌ | ✅ | Client INSERT RLS yo'q |
| Public katalog | ⚠️ ixtiyoriy | ✅ tavsiya | Moderation + sanitize |
| Profil saqlash | ❌ | ✅ | `wallet_balance`, `is_admin` himoya |
| Username tekshiruv | ❌ | ✅ | Enumeration nazorati |
| Onboarding tugatish | ❌ | ✅ | `onboarding_completed` flag |
| Xizmatlar CRUD | ❌ | ✅ | Moderation state |
| Loyihalar / Arizalar | ❌ | ✅ | Hire + contract flow |
| Buyurtmalar | ❌ | ✅ | State machine + escrow |
| To'lov / Checkout | ❌ | ✅ | Webhook + intent |
| Hamyon / Topup | ❌ | ✅ | RPC (`service_role`) |
| Escrow | ❌ | ✅ | Atomik moliya RPC |
| Pul yechish | ❌ | ✅ | Balance + admin approve |
| Sharhlar | ❌ | ✅ | Completed order proof |
| Shartnomalar / Milestone | ❌ | ✅ | Project escrow RPC |
| Nizolar | ❌ | ✅ | SLA + admin resolve |
| Referral | ❌ | ✅ | Bonus logic |
| Trust score | ❌ | ✅ | Computed — read API |
| KYC / Verification | ❌ | ✅ | Admin approve |
| Kompaniya tasdiqlash | ❌ | ✅ | Publish gate |
| Admin panel | ❌ | ✅ | RBAC + audit |
| Komissiya | ❌ | ✅ | Faqat RPC ichida |
| Analytics / Audit | ❌ | ✅ | `service_role` jadvallar |
| Fraud detection | ❌ | ✅ | Backend trigger |
| Bank hisoblar | ❌ | ✅ | Verify flow |
| Terms consent | ❌ | ✅ | Legal audit trail |
| Saqlanganlar | ❌ | ✅ | Owner validation |
| Telefon tasdiqlash | ❌ | ✅ | OTP backend-only |
| Waitlist | ❌ | ✅ | Spam oldini olish |
| Feature flags (admin write) | ❌ | ✅ | Admin RBAC |
| Cron (auto-release escrow) | ❌ | ✅ | `CRON_SECRET` |
| Middleware profil flaglari | ⚠️ edge read | ✅ tavsiya | `/profiles/me/flags` API ga o'tkazish |

---

## 5. TOP 20 — Backend majburiy (risk bo'yicha)

### Critical

| # | Feature | Nega | API endpoint(lar) |
|---|---------|------|-------------------|
| 1 | To'lov / Checkout | Pul oqimi, webhook trust | `POST /payments/orders/{id}/checkout` |
| 2 | Escrow hold/release/refund | Atomik moliya, RPC locked | `PATCH /orders/{id}/status`, webhooks |
| 3 | Hamyon balans | `wallet_balance` inject | `POST /payments/wallet/topup`, `pay-wallet` |
| 4 | Pul yechish | Balance + bank verify | `POST /payments/withdrawals` |
| 5 | Buyurtma status | Complete + escrow alohida = bug | `PATCH /orders/{id}/status` |
| 6 | Komissiya (10%) | Platform fee faqat RPC | `release_escrow_rpc` (backend ichida) |
| 7 | Admin bulk / moliya | Moderator over-privilege | `POST /admin/orders/bulk` |
| 8 | Profil privileged fields | Admin/wallet inject | `PATCH /profiles/me` |

### High

| # | Feature | Nega | API endpoint(lar) |
|---|---------|------|-------------------|
| 9 | Contract / Milestone escrow | Project pul oqimi | `POST /contracts/{id}/fund`, `PATCH /milestones/{id}/status` |
| 10 | Nizolar | Escrow freeze + resolve | `POST /disputes/*`, admin resolve |
| 11 | Sharh yaratish | Fake trust score | `POST /reviews` |
| 12 | Referral bonus | Self-referral | `POST /profiles/me/referral` |
| 13 | KYC tasdiqlash | Identity gate | `POST /platform/verifications`, admin PATCH |
| 14 | Xizmat moderatsiya | `approved` inject | admin `PATCH /admin/services/{id}/moderation` |
| 15 | Arizani yollash | Contract trigger | `PATCH /applications/{id}/status` |
| 16 | Payment webhooks | Imzo tekshiruv | `POST /webhooks/click`, `/webhooks/payme` |
| 17 | Ledger | Audit = balance truth | backend RPC ichida |
| 18 | Bank account verify | Payout fraud | admin `PATCH /admin/bank-accounts/{id}/verify` |

### Medium

| # | Feature | Nega | API endpoint(lar) |
|---|---------|------|-------------------|
| 19 | Terms consent | Legal audit | `POST /trust/terms/consent` |
| 20 | Analytics / fraud logs | service_role tables | `POST /platform/analytics/track` |

---

## 6. Backend'siz ishlamaydigan endpointlar

Quyidagi endpointlar **8002 port (FastAPI) majburiy**. Frontend ularni `api.*` orqali chaqiradi.

```
# Moliya
POST   /api/v1/payments/orders/{id}/checkout
POST   /api/v1/payments/orders/{id}/pay-wallet
POST   /api/v1/payments/wallet/topup
POST   /api/v1/payments/withdrawals
POST   /api/v1/webhooks/click
POST   /api/v1/webhooks/payme

# Buyurtma / Escrow
POST   /api/v1/orders
PATCH  /api/v1/orders/{id}/status

# Shartnoma / Milestone
POST   /api/v1/contracts/{id}/fund
PATCH  /api/v1/milestones/{id}/status

# Profil / Trust
PATCH  /api/v1/profiles/me
POST   /api/v1/trust/terms/consent
POST   /api/v1/platform/verifications

# Admin
PATCH  /api/v1/admin/*
POST   /api/v1/admin/orders/bulk
POST   /api/v1/admin/notifications/broadcast
```

---

## 7. Database — client yozish taqiqlangan jadvallar

Migrationlar bo'yicha quyidagilar **faqat `service_role` / RPC** orqali o'zgaradi:

| Jadval / RPC | Sabab |
|--------------|-------|
| `ledger_entries`, `ledger_accounts` | Moliyaviy yozuvlar |
| `escrow_transactions` | Escrow audit |
| `idempotency_keys` | Idempotency |
| `rate_limit_hits` | Rate limit |
| `fraud_detection_logs` | Fraud |
| `phone_verification_codes` | OTP |
| `moderation_actions` | Admin audit |
| `hold/release/refund_escrow_rpc` | Escrow atomik |
| `pay_order_from_wallet_rpc` | Hamyon to'lov |
| `credit_wallet_topup_rpc` | Topup |
| `request_withdrawal_rpc` | Pul yechish |

**Client INSERT yo'q (backend yaratadi):** `notifications`

---

## 8. Avatar flow (namuna)

To'g'ri ikki bosqichli pattern:

```
1. uploadAvatar(file, userId)     → Supabase Storage (GROUP A)
2. api.updateProfile({ avatar_url }) → Backend API (GROUP B)
```

**Noto'g'ri:** Storage upload + `supabase.from('profiles').update(...)` frontenddan.

---

## 9. Realtime flow (namuna)

```
1. api.sendMessage(...)           → Backend INSERT messages
2. useOrderMessagesRealtime(...)  → Supabase subscribe INSERT/UPDATE
3. UI merge payload.new           → Display (GROUP A faqat listen)
```

---

## 10. Agent / developer qoidalari

1. Yangi feature qo'shganda avval **GROUP A yoki B** ni aniqlang.
2. `src/infrastructure/supabase/data/` kabi direct DB router **qo'shmang**.
3. `apiFetch` ga Supabase bypass **qo'shmang**.
4. Storage upload → metadata doimo API orqali.
5. Moliyaviy operatsiya → faqat backend RPC.
6. PR review: `grep "supabase.from" src/` — faqat middleware/debug bo'lishi kerak.

---

## 11. Bog'liq hujjatlar

| Hujjat | Mavzu |
|--------|-------|
| [AGENTS.md](../AGENTS.md) | Agent qoidalari (arxivitektura bo'limi) |
| [marketplace-escrow-architecture.md](./marketplace-escrow-architecture.md) | Escrow domain model |
| [security-production-setup.md](./security-production-setup.md) | Prod xavfsizlik |
| [supabase-request-audit.md](./supabase-request-audit.md) | Supabase so'rov audit |

---

## 12. Tekshirish checklist

Har yangi feature uchun:

- [ ] Frontend `supabase.from()` ishlatmaydimi?
- [ ] Moliyaviy operatsiya backend RPC orqali bormi?
- [ ] RLS client write ruxsat bermaydimi (backend service_role)?
- [ ] Realtime faqat subscribe (write API)?
- [ ] Storage upload keyin metadata API orqali saqlanadimi?
- [ ] Admin operatsiya audit logga tushadimi?
