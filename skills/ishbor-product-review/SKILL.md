---
name: ishbor-product-review
description: >-
  IshBor.uz product quality audit — UX journeys, onboarding, marketplace health,
  employer and candidate experience. Use when reviewing product flows, marketplace
  balance, role-specific UX, or comparing IshBor to Upwork/Fiverr/LinkedIn quality bars.
disable-model-invocation: true
---

# IshBor Product Review

Production-grade product audit for IshBor.uz (O'zbekiston freelance marketplace). Benchmark bar: **Upwork** (two-sided marketplace depth), **Fiverr** (service discovery clarity), **LinkedIn** (profile trust and professional identity), **Airbnb** (trust between strangers), **Linear** (clarity under complexity).

**Out of scope for this skill:** SEO/growth loops (`ishbor-growth-review`), funnel conversion math (`ishbor-conversion-review`), security (`ishbor-security-review`), Core Web Vitals (`ishbor-performance-review`), component-level i18n/responsive checklist (`ishbor-ui-review`).

---

## Purpose

Evaluate whether IshBor delivers a **coherent, trustworthy, two-sided marketplace** where employers post work and candidates find opportunity without friction, confusion, or dead ends. Product review answers: *"Does the product work as a marketplace, not just as a UI demo?"*

Primary outcomes:
- Surface broken or incomplete user journeys before launch
- Measure marketplace health signals (supply, demand, liquidity proxies)
- Align employer and candidate experiences to role-specific mental models
- Prioritize fixes that unblock real transactions, not cosmetic polish

---

## Context

### Read before auditing

| Order | File | Why |
|-------|------|-----|
| 1 | [AGENTS.md](../../AGENTS.md) | Architecture, routing, import rules |
| 2 | [plan-status.md](../../plan-status.md) | What is shipped vs mock |
| 3 | [mvp.md](../../mvp.md) | MVP scope boundaries |
| 4 | [docs/architecture-supabase-vs-api.md](../../docs/architecture-supabase-vs-api.md) | Auth vs API split |
| 5 | [src/domain/constants/routes.ts](../../src/domain/constants/routes.ts) | Canonical paths |

### Stack and product model

- **Roles:** employer (client), candidate (freelancer), admin
- **Core objects:** profile, service/gig, order, message, wallet, review
- **Default locale:** Uzbek (`uz`); also `ru`, `en`
- **Regions:** 14 viloyat — `@/domain/constants/regions`
- **Pricing:** so'm / mln so'm — never `$`
- **Routing:** App Router `app/(main)/`, dashboard under `/dashboard/*`

### Benchmark mapping

| IshBor surface | Primary benchmark | What to steal |
|----------------|-------------------|---------------|
| Service catalog | Fiverr | Scannable cards, clear price/delivery, category depth |
| Job/project posting | Upwork | Scope clarity, budget signals, applicant quality |
| Profiles | LinkedIn | Credibility hierarchy, skills, portfolio, social proof |
| Trust between parties | Airbnb | Verification cues, reviews, dispute path visibility |
| Dashboard density | Linear | Fast navigation, status clarity, minimal noise |

---

## Audit framework

Run audits in this order. Do not skip Phase 0.

### Phase 0 — Scope declaration (mandatory)

Before findings, output:

```
Audit scope: [pages/flows reviewed]
User roles: [employer | candidate | admin | guest]
Data mode: [live API | mock | mixed]
Benchmark lens: [which benchmarks apply]
Out of scope: [growth | conversion | security | perf — defer to sibling skills]
```

### Phase 1 — Marketplace health

Assess whether the platform can sustain two-sided activity.

| Signal | Check | Benchmark reference |
|--------|-------|---------------------|
| Supply visibility | Can candidates publish services/profiles that appear in catalog? | Fiverr seller listings |
| Demand visibility | Can employers post projects or browse talent? | Upwork job feed |
| Discovery | Category, region, price, rating filters work end-to-end | Fiverr + Upwork filters |
| Liquidity proxies | Empty states explain *how to add* supply/demand, not just "empty" | Airbnb "become a host" |
| Role clarity | User always knows if they are hiring or offering | LinkedIn job vs service modes |
| Cross-side friction | Switching roles (if allowed) does not corrupt state | Upwork dual profile |

**Red flags:** mock data presented as real; catalog always empty; employer and candidate dashboards share confusing nav labels; no path from landing to first listing.

### Phase 2 — Onboarding and activation

| Step | Employer journey | Candidate journey |
|------|------------------|-------------------|
| First visit | Understand "post work" value in <10s | Understand "earn" value in <10s |
| Registration | Role selection is explicit and sticky | Same |
| Profile completion | Company/need signals captured | Skills, portfolio, region captured |
| First action | Post project OR browse talent | Create service OR apply/browse |
| Time-to-value | ≤3 screens to meaningful action | ≤3 screens to meaningful action |

Benchmark: **Stripe onboarding** (progressive disclosure, no dead fields), **LinkedIn** (profile completeness meter without nag spam).

Checklist:
- [ ] Onboarding survives refresh (session + draft state)
- [ ] Skip paths exist but re-engagement prompts are clear
- [ ] Error recovery does not wipe form progress
- [ ] Region and language defaults match O'zbekiston context
- [ ] No `href="#"` on primary onboarding CTAs

### Phase 3 — Employer experience

Audit as an employer trying to hire.

| Area | Questions |
|------|-----------|
| Posting | Can employer define scope, budget (so'm), timeline, region? |
| Discovery | Can employer find candidates by skill, region, rating, price? |
| Evaluation | Portfolio, reviews, response time visible before contact? |
| Communication | Message thread tied to order/project context? |
| Payment clarity | Escrow/hold explained before pay (even if MVP stub) |
| Order tracking | Status machine understandable: pending → active → delivered → complete |

Benchmark: **Upwork** hiring flow, **Airbnb** booking clarity before payment.

### Phase 4 — Candidate experience

Audit as a candidate trying to earn.

| Area | Questions |
|------|-----------|
| Service creation | Title, description, price, delivery, category, media |
| Visibility | Published services appear in catalog with correct metadata |
| Inbound demand | Can see applications, messages, order requests? |
| Earnings | Wallet/history understandable; fees transparent |
| Reputation | Reviews and completion rate visible on profile |
| Motivation | Clear next step when idle (improve profile, add gig, respond) |

Benchmark: **Fiverr** seller dashboard, **LinkedIn** "Open to work" clarity.

### Phase 5 — Cross-cutting UX quality

| Dimension | Standard |
|-----------|----------|
| Navigation | Primary tasks reachable in ≤2 clicks from dashboard |
| Information scent | Labels match user mental model (employer vs candidate) |
| Feedback | Loading, empty, error, success states on every async surface |
| Consistency | Same order status labels in list, detail, and notifications |
| Accessibility | Keyboard nav on modals/menus; focus visible |
| i18n | All visible strings via `t()`; no mixed-language screens |
| Mobile | Core flows usable at 375px without horizontal scroll traps |

Defer visual token compliance to `ishbor-ui-review`. Defer hero CTA conversion to `ishbor-conversion-review`.

### Phase 6 — MVP honesty gate

Flag anything that breaks user trust:

- Mock auth or fake counts without labeling
- Buttons that do nothing on primary paths
- API errors swallowed silently
- Features in nav that 404 or redirect loop
- Payment flows that imply money moved when stubbed

Reference [plan-status.md](../../plan-status.md) before marking P0 on unscoped MVP gaps.

---

## Severity levels

| Level | Label | Definition | SLA |
|-------|-------|------------|-----|
| **P0** | Blocker | Core journey broken; user cannot complete primary task | Fix before any public launch |
| **P1** | Critical | Major friction; workaround exists but damages trust or retention | Fix in current sprint |
| **P2** | Important | Noticeable quality gap vs benchmark; does not block transactions | Schedule within 2 sprints |
| **P3** | Polish | Nice-to-have; parity enhancement | Backlog |

Every finding must include: **level**, **role affected**, **evidence** (URL/route + behavior), **benchmark gap**, **recommended fix**.

---

## Required output format

Use this template exactly:

```markdown
# IshBor Product Review — [YYYY-MM-DD]

## Executive summary
[2-4 sentences: overall product readiness, biggest risk, top recommendation]

## Scope
- Pages/flows: [...]
- Roles: [...]
- Data mode: [...]

## Scorecard
| Dimension | Score (1-5) | Benchmark | Notes |
|-----------|-------------|-----------|-------|
| Marketplace health | | Fiverr/Upwork | |
| Employer experience | | Upwork | |
| Candidate experience | | Fiverr/LinkedIn | |
| Onboarding | | Stripe/LinkedIn | |
| Cross-cutting UX | | Linear | |

## Findings

### P0 — Blockers
| ID | Area | Finding | Evidence | Fix |
|----|------|---------|----------|-----|
| PR-001 | | | | |

### P1 — Critical
...

### P2 — Important
...

### P3 — Polish
...

## Journey maps (gaps only)
### Employer: [step] → [break]
### Candidate: [step] → [break]

## Recommended roadmap
1. [P0/P1 ordered list with effort S/M/L]

## Deferred to sibling skills
- Growth: [...]
- Conversion: [...]
- Security: [...]
- Performance: [...]
- UI tokens: [...]
```

---

## Implementation authority

| Action | Authority |
|--------|-----------|
| Fix broken route links, missing loading/empty states in reviewed flow | **Agent may implement** if scoped and MVP-aligned |
| Add i18n keys for product copy gaps | **Agent may implement** (uz/ru/en) |
| Change information architecture or primary nav | **Recommend only** — user approval required |
| Add/remove MVP features | **Recommend only** — check [mvp.md](../../mvp.md) |
| Mock → live API wiring | **Coordinate** with `ishbor-backend` / `ishbor-mvp` |
| Payment/escrow behavior changes | **Recommend only** — security + backend review required |
| Database schema changes | **Recommend only** |

Never silently expand MVP scope. Mark mock/stub surfaces explicitly in the report.

---

## Success metrics

Track before/after fixes. Product review is successful when metrics move toward targets.

| Metric | Target | Measurement |
|--------|--------|-------------|
| Employer activation rate | ≥40% of registered employers complete first post/browse | Funnel event: `employer_first_action` |
| Candidate activation rate | ≥40% publish profile or first service | `candidate_first_listing` |
| Time-to-first-action | Median ≤5 min post-registration | Session analytics |
| Order flow completion | ≥60% of started orders reach `ACTIVE` | Order state transitions |
| Empty catalog rate | <30% of filter combinations return zero without guidance | Catalog queries |
| Support-prone confusion | ≤5% sessions with repeated failed same-step | Error boundary + form resubmit logs |
| Profile completeness | ≥70% of active users ≥80% profile fields | Profile API |
| Cross-role task success | ≥95% task completion on primary nav paths | Task-based usability runs |

Qualitative bar: a new user from Tashkent can explain **what IshBor does**, **their role**, and **their next step** after 60 seconds without support.

---

## Anti-patterns (product-specific)

- Treating IshBor as a portfolio site instead of a transaction marketplace
- Symmetric copy for employer and candidate (roles have different jobs-to-be-done)
- Feature parity obsession before core order/message path works
- Global footer + landing footer duplication (see AGENTS.md)
- Hardcoded `$` or non-Uzbek region lists
- Auditing pixel colors before auditing whether orders can complete

---

## Quick invocation

User says: *"Product review of registration + dashboard"* → Phase 0 scope → Phases 2-5 on those flows → output template → defer SEO/conversion/security/perf explicitly.
