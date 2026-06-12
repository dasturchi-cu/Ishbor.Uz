# Final Launch Checklist

Production launch checklist for **IshBor.uz**.  
**Last updated:** 2026-06-12  
**Related:** [FINAL_LAUNCH_REVIEW.md](./FINAL_LAUNCH_REVIEW.md) · [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) · [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## How to use this document

| Section | When |
|---------|------|
| **§1 Must complete before launch** | Every item required before the site is public |
| **§2 Can complete after launch** | Safe to defer; track in backlog |
| **§3 Launch day — payments** | **Click / Payme only** — do last, after §1 sign-off |

**Soft launch** (sandbox wallet, `NEXT_PUBLIC_PAYMENTS_ENABLED=false`): complete **§1** only.  
**Full card payments:** complete **§1**, then **§3** on launch day.

Copy §1 into your release ticket. Mark each item **Done** with date + owner.

---

## 1. Must complete before launch

### 1.1 Product defects (blocking)

Fix before any public URL. Evidence: [FINAL_LAUNCH_REVIEW.md](./FINAL_LAUNCH_REVIEW.md), [E2E_MARKETPLACE_SIMULATION_REPORT.md](./e2e-simulation-report/E2E_MARKETPLACE_SIMULATION_REPORT.md).

- [ ] **Applications API** — `GET /api/v1/applications/project/{id}` returns 200 (not 400); freelancer apply → client accept flow works end-to-end
- [ ] **Project submit idempotency** — single click on `/post-project` creates exactly one `projects` row (no duplicate on double-submit / Strict Mode)
- [ ] **Onboarding CTA** — “Loyiha e'lon qilish” navigates to `/post-project` (not `/`)
- [ ] **Dashboard projects widget** — newly created project visible on client dashboard after `?posted=1`
- [ ] **Route conflict** — `/projects/new` does not collide with `/projects/[id]` (use `/post-project` or reserved-slug guard)
- [ ] **Catalog content** — at least **5 approved public services** and **3 freelancer profiles** (no junk titles like `sddsads`, `test`, `tes`)
- [ ] **Junk DB cleanup** — moderate or delete filtered junk rows in `services` / `projects` (public APIs already filter via `catalog_quality`)

### 1.2 Code quality & automated tests (blocking)

- [ ] Release commit on `main` / release branch
- [ ] GitHub Actions CI green (`.github/workflows/ci.yml`)
- [ ] `pnpm verify` on release commit:
  - [ ] `pnpm type-check`
  - [ ] `pnpm lint`
  - [ ] `pnpm test` (Vitest)
  - [ ] `pnpm test:backend` (pytest — target **129+** passing)
  - [ ] `pnpm build`
- [ ] `pnpm test:e2e` against production-like stack (target **87+** passing; document any intentional skips)
- [ ] `e2e/launch-simulation.spec.ts` passes
- [ ] No secrets in client bundle (`NEXT_PUBLIC_*` audit — publishable keys only)

### 1.3 Supabase & database (blocking)

- [ ] Production Supabase project created and linked (`supabase link`)
- [ ] All migrations applied: `pnpm db:push`
- [ ] Schema verified: `pnpm db:verify` → `OK: launch migrations verified`
- [ ] `check_launch_readiness()` — all flags true (RLS, client INSERT blocked, guards)
- [ ] `GET /api/v1/health/ready` → `"status": "ready"` (not `degraded`)
- [ ] **Auth → URL configuration:** Site URL + redirect URLs include `https://ishbor.uz/**`
- [ ] **Leaked password protection** enabled ([Supabase docs](https://supabase.com/docs/guides/auth/password-security))
- [ ] Storage buckets + RLS reviewed (`pnpm check:storage` if applicable)
- [ ] At least one admin: `UPDATE profiles SET is_admin = true WHERE email = '...'`
- [ ] Admin moderation smoke: approve/reject one test service in `/admin`

### 1.4 Backend API deploy (blocking)

Host: Railway / Render / container (`render.yaml`, `backend/Dockerfile`).

**Required environment**

- [ ] `ENVIRONMENT=production`
- [ ] `DOCS_ENABLED=false`
- [ ] `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`
- [ ] `CORS_ORIGINS=https://ishbor.uz` (+ `https://www.ishbor.uz` if used)
- [ ] `PAYMENT_WEBHOOK_SECRET` (long random — webhook hardening)
- [ ] `SESSION_IDLE_MINUTES` (e.g. `120`)
- [ ] `REQUIRE_EMAIL_VERIFIED=true` (after Resend deliverability smoke test)
- [ ] `SENTRY_DSN`, `SENTRY_ENVIRONMENT=production`
- [ ] `NEXT_PUBLIC_PAYMENTS_ENABLED=false` on FE until **§3** (sandbox wallet only pre-launch)

**Recommended**

- [ ] `TURNSTILE_SECRET_KEY` (pairs with frontend site key)
- [ ] `RESEND_API_KEY` + `RESEND_FROM_EMAIL`
- [ ] `REDIS_URL` (optional at low traffic; Postgres fallback works)

**Health checks**

- [ ] `GET https://<API>/api/v1/health` → `ok`
- [ ] `GET https://<API>/api/v1/health/ready` → `ready`
- [ ] Docker image builds in CI

### 1.5 Frontend deploy (blocking)

Host: Vercel (`.github/workflows/deploy-vercel.yml` or dashboard).

**Required environment**

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy JWT `eyJ...` anon key)
- [ ] `NEXT_PUBLIC_API_URL=https://<production-api>/`
- [ ] `NEXT_PUBLIC_SITE_URL=https://ishbor.uz`
- [ ] `MIDDLEWARE_CACHE_SECRET` (`openssl rand -hex 32` — **required in production**)
- [ ] `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_ENVIRONMENT=production`
- [ ] `NEXT_PUBLIC_SESSION_IDLE_MINUTES` (match backend)
- [ ] `NEXT_PUBLIC_PAYMENTS_ENABLED=false` until **§3**

**Deploy checks**

- [ ] Custom domain `ishbor.uz` + SSL active
- [ ] Production API rewrite/proxy hits production backend (not `localhost`)
- [ ] `NEXT_PUBLIC_TURNSTILE_SITE_KEY` if CAPTCHA enabled

### 1.6 Security (blocking)

- [ ] Production CSP + HSTS (`next.config.mjs` — active when `NODE_ENV=production`)
- [ ] Turnstile enabled: CSP allows `https://challenges.cloudflare.com` (`script-src`, `frame-src`)
- [ ] API origin guard rejects unknown `Origin` headers
- [ ] Rate limits active (global + auth/payment routes)
- [ ] Session idle enforced (client + API)
- [ ] Guest → `/dashboard`, `/admin` → login redirect
- [ ] Banned / suspended users blocked (`test_auth_guards.py`)
- [ ] No `supabase.from()` business queries in `src/` (auth/storage/realtime only)

### 1.7 Email & authentication (blocking)

- [ ] Resend sends verification + password-reset on production domain
- [ ] Password reset flow tested on `https://ishbor.uz`
- [ ] `REQUIRE_EMAIL_VERIFIED=true` on backend
- [ ] `VerifyEmailBanner` + checkout gate for unverified users
- [ ] Terms consent gate blocks dashboard until accepted
- [ ] Turnstile on register (recommended) — widget + backend verify both set

### 1.8 Legal & trust content (blocking)

- [ ] `/terms` live — footer + consent gate links
- [ ] `/privacy` live — footer link
- [ ] `/buyer-protection` linked from checkout and catalog trust strips
- [ ] Contact channels work: hello@ishbor.uz / @IshBorUz
- [ ] No fake/demo user-facing data (landing cards, fabricated testimonials) — see [VISIBLE_DATA_CLEANUP_REPORT.md](./VISIBLE_DATA_CLEANUP_REPORT.md)
- [ ] Payment receipts show “Demo to'lov” / “Demo payment” (not “Sandbox test”) while §3 pending

### 1.9 SEO (blocking)

- [ ] `/robots.txt` → 200
- [ ] `/sitemap.xml` generates (requires live `NEXT_PUBLIC_API_URL` for dynamic IDs)
- [ ] `metadataBase` + OG image use production URL
- [ ] Dashboard, admin, messages: `noindex`
- [ ] JSON-LD (Organization + WebSite) on root layout

### 1.10 Accessibility & mobile (blocking)

- [ ] Skip link → `#main-content`
- [ ] Login/register forms in semantic `<form>` elements
- [ ] Mobile overflow pass at **320 / 375 / 390 / 768 / 1024** on:
  - [ ] `/`, `/services`, `/freelancers`, `/login`, `/register`, `/pricing`, `/help`, `/post-project`
- [ ] Catalog drawer width correct on mobile (`drawer-panel`)
- [ ] Touch targets ≥ 44px (header, bottom nav, primary CTAs)

### 1.11 Manual QA — core flows (blocking)

Run on **production URL** or staging clone. Payments: **sandbox wallet only** until §3.

**Guest**

- [ ] Landing → services catalog → service detail → guest checkout modal (no forced login)
- [ ] Search empty state shows discovery hints
- [ ] Post-project wizard (guest landing + authenticated submit)
- [ ] Protected routes redirect to login

**Client**

- [ ] Register → onboarding → dashboard
- [ ] Create project → appears in `/projects` and dashboard widget
- [ ] Wallet top-up (sandbox) → balance updates
- [ ] Order: pending → active → delivered → completed
- [ ] Review after completed order
- [ ] Message thread on order

**Freelancer**

- [ ] Register → create service → visible in catalog
- [ ] Apply to project → client sees application
- [ ] Deliver order → client completes → escrow release (sandbox)

**Admin**

- [ ] `/admin` loads for `is_admin`; denied for others
- [ ] Moderate service / resolve test dispute
- [ ] Analytics funnel page loads

**Payments (sandbox — pre §3)**

- [ ] Pay order from wallet → escrow hold
- [ ] Complete order → release to freelancer balance

### 1.12 Monitoring & operations (blocking)

- [ ] Sentry receiving FE + API events from production
- [ ] Sentry alert → email or Slack
- [ ] Uptime probe on `/api/v1/health` and `https://ishbor.uz` (optional: UptimeRobot, Better Stack)
- [ ] On-call / runbook for P0 incidents ([MONITORING.md](./MONITORING.md))
- [ ] Supabase backup / PITR documented ([BACKUP_RECOVERY.md](./BACKUP_RECOVERY.md))

### 1.13 Pre-launch commands

```powershell
pnpm preflight
pnpm db:push
pnpm db:verify
pnpm test:e2e

# After deploy:
curl https://<API>/api/v1/health/ready
curl https://ishbor.uz/robots.txt
curl https://ishbor.uz/sitemap.xml
```

### 1.14 Sign-off

| Role | Name | Date | OK |
|------|------|------|-----|
| Release owner | | | ☐ |
| Backend | | | ☐ |
| Frontend | | | ☐ |
| QA | | | ☐ |
| Product | | | ☐ |

---

## 2. Can complete after launch

Safe to defer. Does **not** block public launch with sandbox wallet.

### Product & growth

- [ ] Dedicated **staging** environment (Vercel preview + API + Supabase branch)
- [ ] Payment partner logos on landing / footer
- [ ] Pro tier / subscription billing
- [ ] Google Analytics 4 (`NEXT_PUBLIC_GA_MEASUREMENT_ID`)
- [ ] Google OAuth (`NEXT_PUBLIC_GOOGLE_AUTH_ENABLED`)
- [ ] Referral program
- [ ] Additional blog posts beyond seed content
- [ ] Expand catalog to 50+ services organically

### Admin & support

- [ ] Admin user impersonation (audited, time-limited)
- [ ] One-click backup restore in admin UI
- [ ] Advanced fraud automation beyond current rules

### Infrastructure & performance

- [ ] `REDIS_URL` under rate-limit pressure
- [ ] Lighthouse CI on mobile viewport
- [ ] `scripts/tools/mobile-overflow-audit.mjs` in CI
- [ ] WebRTC TURN server for video calls behind strict NAT
- [ ] CDN / API response caching for catalog
- [ ] Load test at target DAU
- [ ] `sendBeacon` for analytics on navigation unload

### UX & accessibility polish

- [ ] Logged-in dashboard deep mobile audit
- [ ] Fix duplicate ARIA IDs (Lighthouse audit)
- [ ] Registration post-submit loading UX (&lt; 3s to redirect)
- [ ] Category icon visual consistency
- [ ] Footer app store badges (when native apps exist)
- [ ] Remove dead i18n keys (`demo_account`, `take_test`)

### Integrations (optional)

- [ ] Telegram bot notifications (`TELEGRAM_BOT_TOKEN` + webhook)
- [ ] Eskiz SMS OTP (`ESKIZ_*`)
- [ ] Phone verification at scale

### Data hygiene

- [ ] One-time SQL purge of hidden junk rows (APIs already filter)
- [ ] Quality-filtered counts in public stats (not raw DB totals)

---

## 3. Launch day — Click & Payme activation

**Do last.** Complete **§1** sign-off first.  
Platform runs on **sandbox wallet** until this section is done.

> Click and Payme are **not** pre-launch blockers. They are **launch-day** tasks only.

### 3.1 Click merchant

- [ ] Merchant account approved
- [ ] `CLICK_MERCHANT_ID`, `CLICK_SERVICE_ID`, `CLICK_SECRET_KEY` in backend env
- [ ] `CLICK_RETURN_URL=https://ishbor.uz/dashboard/orders`
- [ ] Webhook URL: `https://<API>/api/v1/payments/webhooks/click/complete`
- [ ] Webhook test transaction in Click merchant panel
- [ ] Signature verification smoke test

### 3.2 Payme merchant

- [ ] Merchant / cashbox approved
- [ ] `PAYME_MERCHANT_ID`, `PAYME_SECRET_KEY`, `PAYME_LOGIN` in backend env
- [ ] `PAYME_ACCOUNT_FIELD=payment_intent_id` matches kassa config
- [ ] `PAYME_RETURN_URL=https://ishbor.uz/dashboard/orders`
- [ ] JSON-RPC webhook URL in Payme cabinet
- [ ] Test payment in Payme sandbox, then production

### 3.3 Enable live card payments

- [ ] `NEXT_PUBLIC_PAYMENTS_ENABLED=true` on Vercel
- [ ] Backend `click_enabled` / `payme_enabled` true (verify via `/health/ready/detailed` as admin)
- [ ] Update UX: remove “coming soon” / demo badges where providers are live
- [ ] End-to-end: card pay → escrow hold → deliver → complete → release
- [ ] Refund / dispute path tested with small real amount
- [ ] Finance sign-off on settlement reconciliation

### 3.4 Launch day smoke (15 min)

- [ ] New user registers and completes one real payment (minimum amount)
- [ ] Sentry silent (no new payment errors)
- [ ] Admin finance panel shows intent + ledger row
- [ ] Rollback plan if webhooks fail: set `NEXT_PUBLIC_PAYMENTS_ENABLED=false`, keep sandbox wallet

---

## Quick reference

| Launch mode | §1 | §2 | §3 |
|-------------|----|----|-----|
| **Public beta** (sandbox money) | ✅ All | Optional | ❌ |
| **Full payments** (Click + Payme) | ✅ All | Optional | ✅ All |

---

## Related documents

- [FINAL_LAUNCH_REVIEW.md](./FINAL_LAUNCH_REVIEW.md) — scored readiness review
- [LAUNCH_SIMULATION_REPORT.md](./LAUNCH_SIMULATION_REPORT.md) — E2E persona simulation
- [FINAL_AUTONOMOUS_REPORT.md](./FINAL_AUTONOMOUS_REPORT.md) — automated verification
- [PAYMENTS.md](./PAYMENTS.md) · [WEBHOOKS.md](./WEBHOOKS.md) · [SECURITY.md](../SECURITY.md)
