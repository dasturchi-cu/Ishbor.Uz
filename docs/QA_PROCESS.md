# QA Process

Quality assurance workflow for IshBor.uz — manual testing checklists, release gates, and sign-off criteria.

---

## Purpose

IshBor.uz is a marketplace with escrow payments, identity verification, and real-time chat. Automated tests (`pnpm verify`, Playwright) catch regressions in core logic, but manual QA is required for UX flows, payment edge cases, and cross-browser behavior before production releases.

---

## QA roles

| Role | Responsibility |
|------|----------------|
| Developer | Unit tests, self-QA on feature branch, `pnpm verify` green |
| QA / Product | Manual checklist execution, exploratory testing |
| Release owner | Gate sign-off, deployment approval |
| Admin operator | Post-deploy smoke on production |

---

## Environments

| Environment | URL pattern | Data | Payments |
|-------------|-------------|------|----------|
| Local | `localhost:3000` | Dev Supabase | Sandbox wallet |
| Staging | TBD | Staging Supabase | Sandbox |
| Production | `ishbor.uz` | Production Supabase | Live (when enabled) |

Test on staging with production-like data volumes when possible. Never use real user PII in shared test accounts without consent.

---

## Pre-release gates

All gates must pass before a production deployment.

### Gate 1 — Automated (blocking)

```powershell
pnpm verify
```

| Check | Command | Pass criteria |
|-------|---------|---------------|
| TypeScript | `pnpm type-check` | Zero errors |
| Lint | `pnpm lint` | Zero errors |
| Frontend unit | `pnpm test` | All Vitest tests pass |
| Backend unit | `pnpm test:backend` | All pytest tests pass |
| Build | `pnpm build` | Successful production build |

CI must be green on the target commit (`.github/workflows/ci.yml`).

### Gate 2 — Database (blocking)

| Check | Command / action | Pass criteria |
|-------|------------------|---------------|
| Migrations applied | `pnpm db:push` | No pending migrations |
| Schema verify | `pnpm db:verify` | All checks pass |
| RLS policies | Manual review | Financial tables protected |
| Launch readiness | Backend health `/api/v1/health/ready` | `ok: true` |

### Gate 3 — Environment (blocking)

| Variable group | Verified |
|----------------|----------|
| Supabase URL + keys | ✅ |
| JWT secret matches Supabase | ✅ |
| `NEXT_PUBLIC_API_URL` points to correct backend | ✅ |
| CORS allowlist includes production origin | ✅ |
| Sentry DSN configured | ✅ |
| Rate limit backend (Redis or Postgres) | ✅ |

Run `pnpm preflight` and `pnpm dev:check:strict` before deploy.

### Gate 4 — Manual QA (blocking)

Complete the checklists in this document for the release scope. Document results in the release notes or PR description.

### Gate 5 — Security (blocking for financial releases)

| Check | Reference |
|-------|-----------|
| No secrets in client bundle | `NEXT_PUBLIC_*` audit |
| Webhook signatures enabled | Click/Payme production keys |
| Admin RBAC tested | Non-admin cannot access `/admin` |
| Ban/suspend flow | Suspended user blocked from API |
| Escrow state machine | Hold → release → refund paths |

See [SECURITY.md](../SECURITY.md) for the full security checklist.

### Gate 6 — Legal & compliance (blocking for public launch)

| Document | Status |
|----------|--------|
| [PRIVACY_POLICY.md](./PRIVACY_POLICY.md) | Published at `/privacy` |
| [TERMS_OF_SERVICE.md](./TERMS_OF_SERVICE.md) | Published at `/terms` |
| Terms consent gate | User must accept on login |
| Cookie/tracking disclosure | Analytics (Vercel) disclosed |

---

## Manual QA checklist

Copy this checklist into your release PR or QA ticket. Mark each item **Pass**, **Fail**, or **N/A**.

### Authentication & onboarding

- [ ] Register with email + password (uz locale)
- [ ] Register with email + password (ru locale)
- [ ] Login with valid credentials
- [ ] Login with invalid credentials shows error (no stack trace)
- [ ] Logout clears session; protected routes redirect to login
- [ ] Password reset email received and link works
- [ ] Email verification banner visible when unverified
- [ ] TOTP 2FA enrollment and login challenge
- [ ] Phone OTP send and verify (if Eskiz configured)
- [ ] Terms consent gate blocks dashboard until accepted
- [ ] Onboarding checklist progresses and persists
- [ ] OAuth / social login (if enabled)

### Profile & settings

- [ ] Edit profile (name, bio, region from 14 viloyatlar)
- [ ] Upload avatar (Supabase Storage)
- [ ] Public freelancer profile at `/freelancer/{username}`
- [ ] Portfolio gallery add/remove
- [ ] CV builder saves draft server-side
- [ ] Email change flow with confirmation
- [ ] Active sessions list and "logout other devices"
- [ ] Bank account add with MFO validation message
- [ ] Identity verification submit (document upload)
- [ ] Company STIR submit (employer)

### Services catalog

- [ ] Browse `/services` with filters (category, price, region)
- [ ] Service detail page loads packages and seller info
- [ ] Create service (`/services/create`) — draft and publish
- [ ] Edit service returns to `pending` moderation if required
- [ ] Service packages CRUD (tiers, delivery time, price in soʻm)
- [ ] Search returns relevant results
- [ ] Empty state when no results

### Orders & escrow (sandbox)

- [ ] Place order from service detail
- [ ] Order appears in buyer dashboard
- [ ] Order appears in seller dashboard
- [ ] Status flow: `pending` → `active` → `delivered` → `completed`
- [ ] Wallet top-up (sandbox) succeeds
- [ ] Pay order with wallet balance
- [ ] Escrow hold visible in escrow dashboard
- [ ] Seller marks delivered; buyer confirms completion
- [ ] Funds released to seller wallet
- [ ] Dispute opens from order detail
- [ ] Admin dispute resolution (refund / release)
- [ ] Order receipt JSON renders in UI
- [ ] Review submission after completed order

### Projects (birja)

- [ ] Post project (`/post-project`) — draft and publish
- [ ] Project appears in catalog with filters
- [ ] Freelancer applies to project
- [ ] Employer hires applicant → contract/order created
- [ ] Project status transitions (`open`, `in_progress`, `completed`)
- [ ] Milestone escrow release on contract

### Chat & notifications

- [ ] Order creates conversation thread automatically
- [ ] Send text message in real time
- [ ] File attachment upload (private bucket, signed URL)
- [ ] Inbox loads without duplicate threads
- [ ] Notification appears on new message
- [ ] Notification deduplication (no double toasts)
- [ ] Mark notification as read

### Wallet & withdrawals

- [ ] Wallet balance displays correctly
- [ ] Ledger entries list transactions
- [ ] Top-up status polling updates UI
- [ ] Withdrawal request with verified bank account
- [ ] Withdrawal blocked with clear message if bank unverified
- [ ] Referral bonus widget shows stats

### Admin panel

- [ ] Non-admin redirected from `/admin`
- [ ] User list, suspend, ban actions
- [ ] Verification queue: approve/reject identity, company, bank
- [ ] Service moderation approve/reject
- [ ] Dispute overview and resolve
- [ ] Escrow auto-release monitoring
- [ ] Revenue charts load data
- [ ] Platform health panel shows `/health/ready`
- [ ] Audit log CSV export
- [ ] Compliance flags resolve
- [ ] Search analytics dashboard

### Public pages & SEO

- [ ] Landing page (uz default)
- [ ] Pricing, help, FAQ pages
- [ ] `/robots.txt` and `/sitemap.xml` reachable
- [ ] Page titles and meta descriptions present
- [ ] Footer links: terms, privacy, contact
- [ ] Mobile layout at 375px width (no horizontal scroll)

### i18n

- [ ] Switch language uz → ru → en on key pages
- [ ] No hardcoded English on auth forms
- [ ] Prices display in soʻm / mln soʻm (no `$`)
- [ ] Date/number formatting locale-aware

### Performance & accessibility

- [ ] Dashboard loads under 3s on 4G throttle (spot check)
- [ ] No console errors on primary flows
- [ ] Keyboard navigation on login/register forms
- [ ] Focus visible on interactive elements
- [ ] Images have alt text

---

## Exploratory testing focus areas

Run ad-hoc sessions targeting:

1. **Auth race conditions** — Fast navigation after login; refresh on protected pages
2. **Concurrent edits** — Two tabs editing same service/profile
3. **Edge amounts** — 0 soʻm, very large amounts, decimal handling
4. **Network failure** — Offline mid-request; retry behavior
5. **Role switching** — Employer vs freelancer views
6. **Suspended user** — Banner visible; API returns 403

---

## Regression scope by change type

| Change type | Minimum QA |
|-------------|------------|
| UI copy / i18n | Affected pages + language switch |
| New API endpoint | Unit test + manual happy path + auth negative |
| Payment / escrow | Full order checklist + admin dispute |
| Auth / security | Full auth checklist + ban/suspend |
| Database migration | `db:verify` + affected feature checklist |
| Dependency upgrade | `pnpm verify` + smoke E2E |

---

## Bug severity for release decisions

| Severity | Definition | Release impact |
|----------|------------|----------------|
| **P0 — Blocker** | Data loss, payment error, auth bypass, site down | **Stop release** |
| **P1 — Critical** | Core flow broken (order, chat, login) | Fix or defer with waiver |
| **P2 — Major** | Feature degraded, workaround exists | Document in [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) |
| **P3 — Minor** | Cosmetic, edge case | Backlog |

P0 bugs must be fixed before production. P1 requires explicit sign-off from release owner.

---

## Release sign-off template

```markdown
## Release QA Sign-off

- **Version / commit:** v0.1.x / abc1234
- **Release owner:** @name
- **Date:** YYYY-MM-DD
- **Environment tested:** staging

### Gates
- [ ] pnpm verify — PASS
- [ ] CI green — PASS
- [ ] db:push + db:verify — PASS
- [ ] Manual checklist — PASS (X/Y items)
- [ ] Security review — PASS / N/A
- [ ] Legal pages live — PASS

### Known issues accepted
- [Link to KNOWN_ISSUES.md entries]

### Sign-off
- [ ] Approved for production deploy
```

---

## Post-deploy smoke (production)

Within 30 minutes of deploy:

- [ ] Landing page loads (200)
- [ ] Login / register works
- [ ] API health: `GET /api/v1/health`
- [ ] API ready: `GET /api/v1/health/ready`
- [ ] Sentry receiving events (test error if configured)
- [ ] No spike in 5xx errors (monitoring dashboard)

---

## Related documents

- [TESTING.md](./TESTING.md) — Automated test guide
- [BUG_REPORTING.md](./BUG_REPORTING.md) — Bug report template
- [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) — Accepted limitations
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — Dev environment issues
