---
name: ishbor-conversion-review
description: >-
  IshBor.uz conversion audit — landing, registration, employer and candidate funnels,
  CTA optimization, trust architecture. Use when reviewing sign-up rates, hero CTAs,
  or comparing IshBor funnels to Airbnb, Stripe, Upwork, and Fiverr conversion patterns.
disable-model-invocation: true
---

# IshBor Conversion Review

Conversion optimization audit for IshBor.uz. Benchmark bar: **Airbnb** (trust before transaction), **Stripe** (frictionless signup), **Upwork** (role-split funnels), **Fiverr** (clear buyer/seller entry), **Linear** (single primary CTA discipline).

Apply **taste-skill** principles for landing/visual CTAs: one accent, hero fits viewport, no duplicate CTA intent, WCAG contrast, no AI-slop tells.

**Out of scope:** full product journey logic (`ishbor-product-review`), SEO loops (`ishbor-growth-review`), RLS (`ishbor-security-review`), LCP/INP (`ishbor-performance-review`). Component i18n checklist → `ishbor-ui-review`.

---

## Purpose

Maximize the rate at which visitors become **activated users** (registered + first meaningful action) without eroding trust. Conversion review answers: *"Where do we lose people—and what single change recovers the most signups?"*

Primary outcomes:
- Diagnose funnel leaks with evidence-based hypotheses
- Optimize CTAs, forms, and trust signals on money paths
- Separate employer vs candidate conversion strategies
- Produce testable recommendations (A/B ready) not vague "improve UX"

---

## Context

### Read before auditing

| Order | File | Why |
|-------|------|-----|
| 1 | [AGENTS.md](../../AGENTS.md) | Locale, pricing rules |
| 2 | [landing-page.tsx](../../src/presentation/features/landing/landing-page.tsx) | Primary funnel |
| 3 | Auth/register flows | Form friction |
| 4 | [design/figma-tokens.json](../../design/figma-tokens.json) | Trust visual language |
| 5 | User `taste-skill` (design-taste-frontend) when invoked | Landing CTA/visual discipline, anti-slop pre-flight |

### Funnel map

```
Traffic → Landing → Role intent → Register → Verify (if any) → Activate → First transaction
           ↑           ↑              ↑
     conversion    conversion     conversion
     skill         skill          skill
```

**Micro-conversions:**
- Click primary CTA
- Start registration
- Complete registration
- Complete profile step
- First post/browse/message/order

### IshBor-specific constraints

- Default copy: Uzbek; trust cues must work for local audience
- Prices in so'm; no `$` (reduces local trust)
- 14 viloyat — regional relevance increases conversion
- Telegram/social proof common in UZ — authentic > generic

---

## Audit framework

### Phase 0 — Scope declaration

```
Funnel segment: [landing | register | employer | candidate | full]
Traffic type assumed: [cold | retarget | referral]
Primary KPI: [signup rate | activation rate | employer post rate]
Hypothesis backlog: [user-provided or empty]
```

### Phase 1 — Landing page conversion

Benchmark: **Airbnb** hero clarity; **Linear** one primary action.

| Element | Audit standard |
|---------|----------------|
| **Value prop** | Understand "what" + "for whom" in ≤5 seconds |
| **Hero discipline** | Headline ≤2 lines; subtext ≤20 words; CTA visible without scroll |
| **Primary CTA** | One dominant action; label names outcome ("Ish topish", "Ishchi topish") |
| **Secondary CTA** | Max one; different intent (browse vs signup) |
| **Duplicate intent** | No "Boshlash" + "Ro'yxatdan o'tish" + "Bepul sinab ko'rish" same intent |
| **Role split** | Employer vs candidate paths explicit (Upwork-style) |
| **Social proof** | Real logos/stats or honest "early marketplace" framing — no fake numbers |
| **Trust strip** | Escrow/safe payment mention if live; otherwise do not fake |
| **Friction** | No signup wall before browsing catalog (if product allows) |
| **Visual trust** | Primary `#2563EB`; professional, not template slop |

taste-skill pre-flight (landing only): button contrast, CTA wrap, eyebrow restraint, no em-dash, hero padding cap.

### Phase 2 — Registration conversion

Benchmark: **Stripe** — minimal fields, clear errors.

| Check | Standard |
|-------|----------|
| Field count | Minimum viable (email, password, role) |
| Progressive profiling | Defer non-critical fields post-signup |
| Error messages | Inline, i18n, actionable |
| Password UX | Show requirements upfront; strength hint |
| Social login | If present, equal prominence policy documented |
| Mobile forms | Single column; large inputs; `.select-auth` on selects |
| Abandonment | Preserve input on error |
| Trust | Link to terms/privacy near submit |
| Submit button | Specific label ("Hisob yaratish"), not vague "OK" |

Measure: fields per signup, clicks to complete, error rate per field.

### Phase 3 — Employer conversion

Job-to-be-done: *hire reliably, fast, without scam risk.*

| Stage | Optimization lens |
|-------|-------------------|
| Landing → employer CTA | Copy speaks to hiring pain (time, quality, budget) |
| Register as employer | Role pre-selected; no wrong-dashboard surprise |
| First session | Guided "post project" OR "browse talent" — one default |
| Budget/form | So'm input with sane defaults; region selector |
| Trust | Verified profiles, reviews, response time visible |
| Objections | FAQ: payment safety, dispute, fees |
| Exit intent | Save draft project (future) — flag if missing |

Benchmark: **Upwork** client onboarding, **Airbnb** host trust screens.

### Phase 4 — Candidate conversion

Job-to-be-done: *earn income with credible profile.*

| Stage | Optimization lens |
|-------|-------------------|
| Landing → candidate CTA | Earnings/opportunity framing (not generic "join") |
| Register as candidate | Portfolio/skills prompt without overwhelming |
| First gig | Template or examples for service creation |
| Pricing help | Suggested ranges by category (so'm) |
| Motivation | Progress bar for profile completeness |
| Objections | Fee transparency, payout timing |

Benchmark: **Fiverr** seller onboarding, **LinkedIn** profile completeness.

### Phase 5 — CTA optimization system

Document every primary CTA on audited paths:

| Location | Label | Intent class | Visually primary? | Issues |
|----------|-------|--------------|-------------------|--------|

**Intent classes (one label per class per page):**
- `signup`
- `login`
- `browse_catalog`
- `post_work`
- `create_service`
- `contact`

Rules:
- Max one visually primary CTA per viewport
- Verb-first labels; ≤3 words on mobile
- Destructive/secondary styles for low-commit actions
- Loading state on async CTAs (prevent double submit)

### Phase 6 — Trust architecture

Benchmark: **Airbnb** layered trust; **Stripe** security iconography without fear.

Trust stack (audit presence + honesty):

| Layer | Elements |
|-------|----------|
| **Identity** | Verified email/phone badges (if implemented) |
| **Reputation** | Reviews, completion rate, member since |
| **Transaction** | Escrow explanation, refund policy |
| **Platform** | Contact support, legal pages, company info |
| **Social** | Testimonials (real), partner logos (real SVG) |
| **Risk reversal** | Clear dispute path; no hidden fees |

**Trust failures (P0 conversion):**
- Fake review counts
- Implied escrow without backend
- Missing privacy/terms on signup
- Generic stock "team" photos labeled as users

### Phase 7 — Experiment readiness

For each P1/P2 recommendation, specify:

- **Hypothesis:** If we [change], then [metric] because [reason]
- **Primary metric:** e.g. signup CR
- **Guardrail:** bounce rate, support tickets
- **Effort:** S/M/L
- **Test type:** A/B, before/after, user test

---

## Severity levels

| Level | Label | Definition |
|-------|-------|------------|
| **P0** | Blocker | Active deception or broken CTA on primary funnel |
| **P1** | Critical | >20% relative drop vs benchmark pattern (e.g. signup wall, 8-field form) |
| **P2** | Important | Measurable friction; clear best-practice fix |
| **P3** | Polish | Copy/color micro-opts |

Prefix **CONV-###**. Tie each finding to a **funnel step** and **intent class**.

---

## Required output format

```markdown
# IshBor Conversion Review — [YYYY-MM-DD]

## Executive summary
[Biggest leak step, estimated recovery opportunity, #1 test]

## Scope
[...]

## Funnel metrics (actual or estimated)
| Step | Users | Conv % | Benchmark | Gap |
|------|-------|--------|-----------|-----|
| Visit → CTA click | | | Airbnb/Linear | |
| CTA → Reg start | | | Stripe | |
| Reg start → Complete | | | Stripe | |
| Complete → Activate | | | Upwork/Fiverr | |

## Scorecard
| Dimension | Score (1-5) | Benchmark | Notes |
|-----------|-------------|-----------|-------|
| Landing conversion | | Airbnb/Linear | |
| Registration | | Stripe | |
| Employer funnel | | Upwork | |
| Candidate funnel | | Fiverr/LinkedIn | |
| CTA system | | Linear | |
| Trust architecture | | Airbnb/Stripe | |

## CTA inventory
[table from Phase 5]

## Findings
### P0 / P1 / P2 / P3 (CONV-###)

## Trust stack audit
| Layer | Present | Honest | Fix |
|-------|---------|--------|-----|

## Experiment backlog
| ID | Hypothesis | Metric | Effort |
|----|------------|--------|--------|

## Deferred
- Product journeys: [...]
- Growth/SEO: [...]
- Performance: [...]
```

---

## Implementation authority

| Action | Authority |
|--------|-----------|
| Fix CTA labels, contrast, duplicate intents on landing | **Agent may implement** + i18n uz/ru/en |
| Reduce form fields (MVP-safe) | **Agent may implement** with product confirm |
| Add trust copy linking to real policies | **Agent may implement** |
| Change hero layout/IA | **Recommend** — major visual change |
| Fake urgency / countdown timers | **Forbidden** |
| Dark patterns (hidden unsubscribe, trick questions) | **Forbidden** |
| Pricing/fees display changes | **Recommend** — legal/business review |

Coordinate with taste-skill for landing redesigns; do not sacrifice trust for conversion hacks.

---

## Success metrics

| Metric | Target | Funnel step |
|--------|--------|-------------|
| Landing → CTA click rate | ≥8% cold traffic | Hero |
| CTA → registration start | ≥50% | Intent match |
| Registration completion rate | ≥70% starts | Form |
| Employer activation (7d) | ≥35% new employers | First post/browse |
| Candidate activation (7d) | ≥35% new candidates | First listing |
| Form error rate | ≤10% submits | Validation |
| Mobile signup share completion | Parity ±5% vs desktop | Responsive |
| Trust page views pre-signup | ≥15% registrants | Privacy/terms |
| Experiment win rate | ≥1 validated lift / quarter | A/B program |

Conversion review succeeds when recommendations are **prioritized by incremental activation**, not page beauty alone.

---

## Anti-patterns

- Multiple primary-colored buttons fighting for attention
- Signup before showing catalog value (unless strategic)
- English CTAs on default Uzbek site
- Fake "127 users online" widgets
- Generic "Elevate your career" slop copy
- Optimizing registration while landing bounce is 80%
- `$` pricing on Uzbekistan marketplace

---

## Sibling skill routing

| Symptom | Route to |
|---------|----------|
| "Order flow confusing after login" | `ishbor-product-review` |
| "Not indexed on Google" | `ishbor-growth-review` |
| "Users can see others' orders" | `ishbor-security-review` |
| "Page loads in 6s" | `ishbor-performance-review` |
| "Missing translation key" | `ishbor-ui-review` |

---

## Quick invocation

*"Conversion review landing + register"* → Phase 0 → Phases 1-2, 5-6 → funnel table → CONV findings → top 3 experiments.
