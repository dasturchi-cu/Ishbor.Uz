---
name: ishbor-security-review
description: >-
  IshBor.uz security audit — auth, authorization, Supabase RLS, uploads, payments,
  secrets, OWASP Top 10. Use when reviewing security posture, RLS policies, API auth,
  or comparing IshBor trust model to Stripe, Supabase, and marketplace standards.
disable-model-invocation: true
---

# IshBor Security Review

Security audit for IshBor.uz. Benchmark bar: **Stripe** (payments + API key hygiene), **Supabase** (RLS-first data access), **Upwork/Fiverr** (marketplace abuse patterns), **Linear** (session handling, minimal attack surface).

**Out of scope:** SEO (`ishbor-growth-review`), CTA copy (`ishbor-conversion-review`), bundle size (`ishbor-performance-review`), general UX (`ishbor-product-review`). UI contrast/a11y → `ishbor-ui-review`.

---

## Purpose

Identify vulnerabilities and trust failures before they become incidents. Security review answers: *"Can the wrong user access the wrong data, money, or account—and can we detect it?"*

Primary outcomes:
- Enforce least-privilege across Supabase, FastAPI, and Next.js layers
- Validate auth/session lifecycle and authorization boundaries
- Harden file uploads and payment webhooks
- Map findings to OWASP Top 10 with IshBor-specific evidence

---

## Context

### Read before auditing

| Order | File | Why |
|-------|------|-----|
| 1 | [AGENTS.md](../../AGENTS.md) | Frontend ↔ Supabase ↔ API split |
| 2 | [docs/architecture-supabase-vs-api.md](../../docs/architecture-supabase-vs-api.md) | Allowed direct Supabase usage |
| 3 | `middleware.ts` | Route protection |
| 4 | `supabase/migrations/` | RLS policies |
| 5 | Backend auth deps (FastAPI) | JWT validation |
| 6 | `.env.example` (never commit `.env`) | Required secrets |

### Trust boundaries

```
Browser
  ├─ Supabase Auth (session) — login/register/logout only
  ├─ Supabase Storage — avatar/media uploads (RLS + bucket policies)
  ├─ Supabase Realtime — chat/notifications (channel auth)
  └─ FastAPI — business logic, payments, admin (Bearer JWT)

Backend (service_role) → Supabase Postgres with app-level authz
```

**Rule:** No business logic split across Supabase client + API for the same resource. Flag dual paths.

### Secrets inventory (expected)

| Secret | Location | Must never |
|--------|----------|------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Backend only | Expose to client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client | Used to bypass RLS |
| JWT signing secret | Backend | Hardcode in repo |
| Click/Payme keys | Backend env | Log or return in API responses |
| Webhook secrets | Backend | Skip signature verification |

---

## Audit framework

### Phase 0 — Scope declaration

```
Audit surface: [auth | RLS | API | uploads | payments | full]
Environment: [local | staging | prod config review]
Threat model: [guest | authenticated user | malicious peer | admin]
Data classes: [PII | payment | messages | public catalog]
```

### Phase 1 — Authentication

Benchmark: **Stripe** API keys + session docs; **Supabase Auth** session refresh.

| Check | Pass criteria |
|-------|---------------|
| Session storage | HttpOnly cookies or secure Supabase session; no tokens in localStorage for sensitive ops |
| Refresh | Token refresh handled; expired session redirects cleanly |
| Logout | Server/client session invalidated; back button cannot act |
| Password policy | Min length, rate limit on login/register |
| Email verification | Required before sensitive actions (if enabled) |
| OAuth (if any) | State param, redirect URI allowlist |
| MFA | N/A for MVP — document future requirement |

Files: `middleware.ts`, auth providers, Supabase client setup, login/register flows.

### Phase 2 — Authorization

Benchmark: **Upwork** — users cannot read others' private orders.

| Layer | Audit |
|-------|-------|
| **Middleware** | Protected routes match [routes.ts](../../src/domain/constants/routes.ts); no bypass via `_next` |
| **Client guards** | `AuthGuard` is UX only — never sole protection |
| **FastAPI** | Every mutating endpoint validates `user_id` vs resource owner |
| **Admin** | Separate role; admin routes not reachable by enum tampering |
| **IDOR** | Swap UUID in URL/API — must 403/404 |

Test matrix (document results):

| Action | Owner | Other user | Guest |
|--------|-------|------------|-------|
| Read own order | allow | deny | deny |
| Read others' message thread | deny | deny | deny |
| Update own profile | allow | deny | deny |
| Admin stats | admin only | deny | deny |

### Phase 3 — Supabase RLS

Benchmark: **Supabase** "RLS always on" production checklist.

For each table with user data:

- [ ] RLS **enabled**
- [ ] No `USING (true)` on sensitive tables without justification
- [ ] Policies use `auth.uid()` correctly
- [ ] `INSERT` policies prevent impersonation (see `profiles_insert_guard` migration pattern)
- [ ] `service_role` only on backend; anon key cannot escalate
- [ ] Realtime channels filtered by participant

Review: `supabase/migrations/*.sql`, especially profiles, messages, orders, wallets.

**P0:** Any table with PII accessible via anon key without RLS.

### Phase 4 — File uploads

| Check | Standard |
|-------|----------|
| Bucket policy | Authenticated write to own prefix only |
| File type | Allowlist (image/webp, pdf if needed); verify MIME + magic bytes |
| Size limits | Enforced client + server |
| Path traversal | Sanitize filenames; no user-controlled full path |
| Public URLs | Only intentionally public assets |
| Malware | Document scan gap for MVP; flag for production |
| Signed URLs | Expiring URLs for private docs |

Storage must go through Supabase Storage per AGENTS.md — not arbitrary API file dump without validation.

### Phase 5 — Payments & escrow

Benchmark: **Stripe** webhooks idempotency + signature verification.

| Check | Standard |
|-------|----------|
| Webhook signature | Click/Payme signatures verified before state change |
| Idempotency | Duplicate webhook does not double-credit |
| Amount tampering | Server computes amount; client cannot set arbitrary price on pay |
| State machine | Order status transitions validated server-side |
| PCI scope | No raw card data in IshBor infra (redirect to provider) |
| Audit log | Payment events append-only trail |
| Refund/dispute | Authorized roles only |

Coordinate with `ishbor-backend` for implementation fixes.

### Phase 6 — Secrets & configuration

- [ ] `.env` in `.gitignore`; no secrets in git history (flag if found)
- [ ] `.env.example` documents keys without values
- [ ] No `NEXT_PUBLIC_*` for sensitive keys
- [ ] CI/CD secrets in platform vault, not repo
- [ ] Error responses do not leak stack traces or SQL in production
- [ ] CORS restricted to known origins
- [ ] Rate limiting on auth and webhook endpoints

### Phase 7 — OWASP Top 10 (2021) mapping

| OWASP | IshBor focus areas |
|-------|-------------------|
| A01 Broken Access Control | RLS, IDOR, admin routes, AuthGuard-only pages |
| A02 Cryptographic Failures | TLS, password hashing (bcrypt/argon), JWT alg |
| A03 Injection | SQL via ORM parameterized; no raw string concat |
| A04 Insecure Design | Escrow flow, dispute abuse, fake reviews |
| A05 Security Misconfiguration | Default Supabase policies, open buckets, debug mode |
| A06 Vulnerable Components | `pnpm audit`, Python deps audit |
| A07 Auth Failures | Session fixation, weak passwords, no rate limit |
| A08 Software/Data Integrity | Webhook signatures, dependency pinning |
| A09 Logging Failures | Auth failures, payment anomalies logged |
| A10 SSRF | URL fetch in backend (if any) allowlist |

Each finding maps to **one OWASP ID** minimum.

### Phase 8 — Marketplace abuse (domain-specific)

| Threat | Mitigation audit |
|--------|------------------|
| Fake listings | Report flow; admin moderation hooks |
| Review bombing | One review per completed order |
| Message spam | Rate limits; block user |
| Wallet fraud | Withdrawal verification |
| Multi-account referral | Device/email fingerprint (future) |
| Scraping | Rate limits on catalog API |

---

## Severity levels

| Level | Label | Definition | Response |
|-------|-------|------------|----------|
| **P0** | Critical | Exploitable now; data/money exposure | Stop ship; hotfix |
| **P1** | High | Serious weakness; exploit needs minor conditions | Fix before launch |
| **P2** | Medium | Defense-in-depth gap | Scheduled fix |
| **P3** | Low | Hardening, logging, documentation | Backlog |

Security findings use prefix **SEC-###**. Never downgrade P0 without explicit user acceptance of risk.

---

## Required output format

```markdown
# IshBor Security Review — [YYYY-MM-DD]

## Executive summary
[Overall risk rating: Critical / High / Moderate / Low]
[Ship recommendation: Block | Conditional | Proceed]

## Scope & threat model
[...]

## Scorecard
| Area | Score (1-5) | Benchmark | Notes |
|------|-------------|-----------|-------|
| Authentication | | Stripe/Supabase | |
| Authorization | | Upwork | |
| RLS / data layer | | Supabase | |
| Uploads | | — | |
| Payments | | Stripe | |
| Secrets & config | | Stripe | |
| OWASP coverage | | — | |

## Findings

### P0 — Critical (SEC-###)
| ID | OWASP | Finding | Evidence | Remediation | Owner |
|----|-------|---------|----------|-------------|-------|

### P1 / P2 / P3
...

## RLS policy matrix
| Table | RLS on | SELECT | INSERT | UPDATE | DELETE | Issues |
|-------|--------|--------|--------|--------|--------|--------|

## IDOR test results
[...]

## Secrets scan
[...]

## Remediation roadmap
1. [ordered by risk]

## Accepted risks (if any)
[Explicit user sign-off required]
```

---

## Implementation authority

| Action | Authority |
|--------|-----------|
| Fix missing RLS policy, tighten bucket rule | **Agent may implement** with migration |
| Add rate limiting middleware | **Agent may implement** |
| Rotate exposed secret | **User must rotate** — agent documents steps only |
| Change payment state machine | **Recommend + backend review** |
| Disable feature until fixed | **Recommend** — user decides |
| Penetration test claims | **Never** — recommend professional pentest for prod |

**Never** commit real secrets, exploit live prod without authorization, or skip webhook signature verification "temporarily".

---

## Success metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| RLS coverage | 100% tables with PII | Migration audit |
| IDOR test pass rate | 100% deny unauthorized | Manual/automated matrix |
| Critical vulns open | 0 at launch | Tracker |
| Mean time to patch P0 | <24h | Incident log |
| Webhook verification | 100% endpoints | Code audit |
| Dependency critical CVEs | 0 unmitigated | `pnpm audit`, pip audit |
| Auth brute-force block | Rate limit triggers | Load test |
| Secret leakage scans | 0 in repo | gitleaks/trufflehog |
| Security regression tests | IDOR + RLS in CI | Future pipeline |

Security review succeeds when **ship recommendation is evidence-backed**, not when the checklist is green-washed.

---

## Anti-patterns

- Trusting `AuthGuard` as security boundary
- `supabase.from('orders').select('*')` from client for business data
- Service role key in Next.js server component bundled to client
- Logging JWT or payment payloads
- "We'll add RLS later" on staging data copied from prod
- Security through obscurity (hidden admin URL only)

---

## Quick invocation

*"Security review RLS + payments"* → Phase 0 → Phases 3, 5, 7 → IDOR matrix → output template → **Block/Conditional/Proceed** recommendation.
