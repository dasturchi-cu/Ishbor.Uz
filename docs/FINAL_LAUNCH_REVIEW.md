# IshBor.uz — Final Launch Review

**Date:** 2026-06-12  
**Reviewer:** Autonomous launch simulation + verification stack  
**Scope:** Product readiness across 10 domains  
**Evidence:** `LAUNCH_SIMULATION_REPORT.md`, `FINAL_AUTONOMOUS_REPORT.md`, `E2E_MARKETPLACE_SIMULATION_REPORT.md`, `VISIBLE_DATA_CLEANUP_REPORT.md`, E2E 87/90, pytest 129/129

---

## Overall score: **7.6 / 10**

**Verdict:** Ready for **soft launch** (sandbox payments, limited beta). **Not ready** for full public marketing launch until payments, deploy, catalog content, and project-application flow are resolved.

| Category | Score | One-line summary |
|----------|-------|------------------|
| **Product** | **7.0** | Broad MVP surface; core service-order path works; project hire flow incomplete |
| **UX** | **7.5** | Strong guest journeys and i18n; onboarding and dashboard gaps remain |
| **UI** | **8.0** | Cohesive design system; empty catalog hurts first impression |
| **Mobile** | **8.0** | Guest routes verified 320–1024px; logged-in mobile less audited |
| **Security** | **8.0** | Solid code-level hardening; production config not yet applied |
| **Database** | **8.5** | RLS + migrations green; junk rows and duplicate submits in data |
| **Performance** | **7.5** | Build optimized; no Lighthouse CI; API proxy contention under load |
| **SEO** | **8.0** | Technical SEO complete; thin indexable inventory limits growth |
| **Accessibility** | **7.5** | Landmarks and skip link present; duplicate ARIA IDs and form semantics gaps |
| **Reliability** | **7.5** | 216 automated tests green; intermittent API aborts and one broken apply endpoint |

---

## Category deep-dives

### Product — 7.0 / 10

**Strengths**
- End-to-end service marketplace: catalog → detail → guest checkout modal → order states → escrow sandbox → chat → reviews
- Freelancer tools: service create, profile, projects browse, verification workflow
- Admin: moderation, disputes, analytics funnel, fraud center
- Post-project wizard, wallet top-up (sandbox), buyer protection narrative

**Gaps**
- `GET /api/v1/applications/project/{id}` returns **400** — freelancer apply → client accept flow blocked ([E2E marketplace report](./e2e-simulation-report/E2E_MARKETPLACE_SIMULATION_REPORT.md))
- Duplicate `POST /projects` on single submit (idempotency missing)
- Live Click/Payme deferred (code ready, credentials not)
- Hire → deliver → review loop not verified in full simulation
- Catalog has ~1 junk public service — weak product demonstration

### UX — 7.5 / 10

**Strengths**
- Guest checkout without forced login redirect
- Search discovery hints on empty results
- uz / ru / en coverage on primary flows
- Trust/escrow signals on catalog pages
- Demo payment labels (not “sandbox test”)

**Gaps**
- Onboarding “Loyiha e'lon qilish” CTA may navigate to `/` instead of `/post-project`
- Dashboard projects widget empty after successful create (filter mismatch)
- Registration 8s+ spinner before redirect
- Terms modal may reappear after registration
- `/projects/new` route conflict with `[id]` dynamic route

### UI — 8.0 / 10

**Strengths**
- Figma tokens → CSS variables; primary `#2563EB` Kwork-style
- shadcn/ui components; consistent dashboard shell
- Landing empty states (no fake freelancer cards)
- Admin fraud labels localized

**Gaps**
- Sparse catalog looks unfinished to new visitors
- Payment partner logo placeholders until live contracts

### Mobile — 8.0 / 10

**Strengths**
- No horizontal overflow on guest routes at 320px, 375px, 1024px (verified)
- Mobile drawer width fix; header/bottom nav overflow fixes
- Mobile-first catalog filter drawer

**Gaps**
- Logged-in dashboard deep mobile audit incomplete
- Lighthouse mobile performance not in CI

### Security — 8.0 / 10

**Strengths**
- Supabase RLS migrations; `check_launch_readiness()` green
- Rate limits, Turnstile on register, session idle enforcement
- Auth guards (401/403); admin routes protected
- No `supabase.from()` business queries in frontend
- Redacted health endpoint; CAPTCHA + ban/suspend guards

**Gaps**
- Supabase **leaked password protection** disabled (dashboard setting)
- `REQUIRE_EMAIL_VERIFIED=false` in dev — must enable for production
- Production secrets not deployed (`MIDDLEWARE_CACHE_SECRET`, Sentry DSN)
- Optional auth on some public endpoints (minor disclosure)
- No admin impersonation (support workaround: DB)

### Database — 8.5 / 10

**Strengths**
- Migrations through `20240631180000`; escrow, payment_intents, notifications schema
- `catalog_quality` filters junk from public APIs
- Waitlist, analytics_events, audit patterns in place

**Gaps**
- Junk rows still in DB (filtered, not deleted)
- Duplicate project rows from double submit
- `project_applications` empty — apply flow never completed in simulation

### Performance — 7.5 / 10

**Strengths**
- Production build ~40s; `optimizePackageImports` for heavy libs
- AVIF/WebP images; wallet summary batch endpoint
- Services catalog skeleton fix (no blank gap on first load)

**Gaps**
- Next.js API proxy contention under parallel load (E2E mitigated via direct `:8002`)
- Redis optional — rate limit / cache under scale needs `REDIS_URL`
- No Lighthouse / Core Web Vitals gate in CI

### SEO — 8.0 / 10

**Strengths**
- Dynamic `sitemap.ts` (services, freelancers, regions, blog)
- `robots.txt`, OG image, JSON-LD, dashboard/admin `noindex`
- 14 region landing pages; canonical App Router metadata

**Gaps**
- Few indexable services/freelancers — limits organic long-tail
- `NEXT_PUBLIC_API_URL` required in production for sitemap generation
- Content marketing (blog) thin at launch

### Accessibility — 7.5 / 10

**Strengths**
- Skip-to-content link; `#main-content` landmark
- Login form `aria-invalid` on validation
- i18n does not break screen reader language switching path

**Gaps**
- `duplicate-id-aria` flagged in Lighthouse audit
- Register password fields outside semantic `<form>`
- Button name ambiguity (“Kirish” matches Google + submit)
- Agentic browsing score 32 (unlabeled controls in places)

### Reliability — 7.5 / 10

**Strengths**
- Playwright **87/90** passed (3 skipped — test credentials)
- Backend pytest **129/129**
- Health + ready endpoints; CI workflow defined
- Auth redirect E2E coverage on all dashboard paths

**Gaps**
- Intermittent `ERR_ABORTED` on catalog API during fast navigation
- Test client `diag-timeout-test@ishbor.uz` login skipped in latest run
- No staging environment for pre-prod soak testing
- WebRTC / video calls not in automated scope

---

## Launch blockers

### P0 — Must fix before any public URL

| # | Blocker | Owner | Evidence |
|---|---------|-------|----------|
| B1 | **Production not deployed** | DevOps | `plan-status.md`, `KNOWN_ISSUES.md` |
| B2 | **Production env + secrets** | DevOps | Sentry, CORS, `MIDDLEWARE_CACHE_SECRET`, Supabase keys |
| B3 | **Supabase leaked password protection** | Dashboard | Security advisor WARN |
| B4 | **`pnpm db:push` + `pnpm db:verify` on prod** | DevOps | Migrations in repo |

### P0 — Must fix before marketing / real money

| # | Blocker | Owner | Evidence |
|---|---------|-------|----------|
| B5 | **Live Click/Payme credentials** | Business + DevOps | Deferred by design; sandbox works |
| B6 | **Catalog content** — no credible public services | Product/Ops | Only junk service `sddsads` in DB |
| B7 | **Applications API 400** — project hire flow broken | Engineering | `E2E_MARKETPLACE_SIMULATION_REPORT.md` BUG-001 |

### P1 — Fix before scaling users

| # | Blocker | Impact |
|---|---------|--------|
| B8 | Duplicate project creation on submit | Data integrity, user confusion |
| B9 | `REQUIRE_EMAIL_VERIFIED=true` | Spam/abuse risk without it |
| B10 | Admin test account + moderation QA | Trust & safety unverified in UI |
| B11 | Onboarding CTA → `/post-project` | Broken client activation path |

---

## Remaining risks

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| API proxy timeouts under load | Medium | Medium | Direct API URL in prod client; Redis rate limit |
| Thin marketplace liquidity | High | High | Seed services; employer outreach before ads |
| Email deliverability unknown | Medium | Medium | Resend test + verification gate |
| No staging environment | Medium | High | Clone stack week 1 post-launch |
| Hydration mismatch on projects catalog | Low | Medium | SSR snapshot audit on `projects-catalog.tsx` |
| Backup restore UI record-only | Low | Low | Rely on Supabase PITR |
| WebRTC call quality untested | Medium | Medium | Manual QA on staging |
| Analytics funnel data loss on navigation abort | Low | High | `sendBeacon` for unload events |

---

## Post-launch improvements

### Week 1–2 (high ROI)

1. Fix applications API + full client ↔ freelancer E2E (apply → accept → message → deliver → review)
2. Idempotency key on `POST /projects` and order create
3. Seed 10–20 quality-approved demo services and 5 freelancers
4. Enable `REQUIRE_EMAIL_VERIFIED` after Resend smoke test
5. Add mobile Lighthouse to CI (`lighthouserc.cjs`)
6. Staging environment (Vercel preview + API + Supabase branch)

### Month 1 (growth & ops)

7. Live Click/Payme activation + partner logos
8. GA4 + conversion funnel dashboard review
9. Telegram notification bot production wiring
10. Admin impersonation for support (audited, time-limited)
11. One-time SQL cleanup of junk DB rows
12. Redis for rate limits and session cache

### Quarter 1 (scale)

13. Pro subscription billing
14. Referral program
15. Region SEO content expansion
16. Logged-in mobile UX pass (tablet + dashboard)
17. `sendBeacon` analytics for navigation aborts
18. A11y pass: duplicate ARIA IDs, form semantics, focus traps in modals

---

## Test evidence summary

```
Automated (2026-06-12 final run)
├── Playwright E2E ........ 87 passed, 3 skipped (90)
├── Backend pytest ........ 129 passed
├── Vitest ................ 21 passed (prior verify)
├── type-check + lint ..... pass (prior verify)
└── production build ...... pass (prior verify)

Manual / MCP (prior runs)
├── Guest mobile 320–1024 . no overflow
├── Supabase launch check . green
└── Deep marketplace sim .. partial (apply flow blocked)
```

---

## Launch recommendation

| Launch type | Ready? | Conditions |
|-------------|--------|------------|
| **Internal beta** | ✅ Yes | Deploy + sandbox wallet + 1 admin user |
| **Soft launch** (invite-only) | ⚠️ Almost | Above + seed catalog + fix applications API |
| **Public marketing launch** | ❌ No | Above + live payments + email verification + moderation QA + leaked-password protection |

---

## Sign-off matrix

| Gate | Status |
|------|--------|
| Core guest flows (browse, checkout modal, auth redirect) | ✅ |
| Automated test suite | ✅ |
| Security code review | ✅ |
| Production deploy | ⬜ |
| Live payments | ⬜ |
| Project apply/hire flow | ❌ |
| Credible catalog content | ❌ |
| Admin moderation verified | ⬜ |

---

*Related documents:* [LAUNCH_SIMULATION_REPORT.md](./LAUNCH_SIMULATION_REPORT.md) · [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md) · [FINAL_AUTONOMOUS_REPORT.md](./FINAL_AUTONOMOUS_REPORT.md) · [KNOWN_ISSUES.md](./KNOWN_ISSUES.md)
