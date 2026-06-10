---
name: ishbor-growth-review
description: >-
  IshBor.uz growth audit — SEO, referrals, virality, acquisition, retention, and
  growth loops. Use when reviewing discoverability, sharing mechanics, funnel analytics,
  or comparing IshBor acquisition/retention to LinkedIn, Upwork, Fiverr, Airbnb.
disable-model-invocation: true
---

# IshBor Growth Review

Growth systems audit for IshBor.uz. Benchmark bar: **LinkedIn** (professional graph + virality), **Upwork/Fiverr** (SEO landing scale + supply-side acquisition), **Airbnb** (referral loops + trust-led growth), **Linear** (word-of-mouth via craft + changelog SEO).

**Out of scope:** product journey completeness (`ishbor-product-review`), landing CTA psychology (`ishbor-conversion-review`), auth/RLS (`ishbor-security-review`), page speed (`ishbor-performance-review`).

---

## Purpose

Determine whether IshBor can **acquire**, **activate**, **retain**, and **expand** users through repeatable loops—not one-off marketing spikes. Growth review answers: *"Will people find IshBor, come back, and bring others?"*

Primary outcomes:
- SEO foundation for marketplace long-tail (services, regions, categories)
- Identifiable acquisition channels with measurable attribution
- Retention hooks aligned to marketplace cadence (orders, messages, earnings)
- Referral/virality mechanics that fit O'zbekiston context (Telegram, word-of-mouth)

---

## Context

### Read before auditing

| Order | File | Why |
|-------|------|-----|
| 1 | [AGENTS.md](../../AGENTS.md) | Routing, locale default |
| 2 | [plan-status.md](../../plan-status.md) | Live vs planned growth features |
| 3 | [mvp.md](../../mvp.md) | Post-MVP growth scope |
| 4 | `app/` layout and page metadata | SEO implementation |
| 5 | [src/domain/constants/routes.ts](../../src/domain/constants/routes.ts) | Indexable URLs |

### Growth model for IshBor

```
Acquisition → Activation → Retention → Referral → Revenue
     ↑                                              |
     └──────────── content/SEO loops ─────────────────┘
```

**Channels (priority for UZ market):**
1. Organic search (category + region pages)
2. Direct / brand
3. Referral (invite employer or candidate)
4. Social share (Telegram, Instagram bio links)
5. Partnerships (future: edu, coworking, biz associations)

**Not in MVP (flag, do not score as P0):** paid ads infra, affiliate program, mobile app store ASO.

---

## Audit framework

### Phase 0 — Scope declaration

```
Audit scope: [SEO | referrals | retention | full growth stack]
Indexable surfaces: [list routes]
Analytics maturity: [none | events planned | production]
Locale focus: [uz primary | ru/en secondary]
Sibling deferrals: [conversion | product | perf | security]
```

### Phase 1 — SEO & discoverability

Benchmark: **Fiverr/Upwork** programmatic SEO; **Linear** docs/blog SEO hygiene.

| Area | Audit checks |
|------|--------------|
| **Technical SEO** | `robots.txt`, sitemap.xml, canonical URLs, no duplicate routes |
| **Metadata** | Unique `title` + `description` per major route; OG/Twitter cards |
| **Structured data** | `Organization`, `WebSite`, `Service`/`JobPosting` where applicable |
| **URL architecture** | Clean slugs: `/services/[category]`, `/regions/[slug]` (present or planned) |
| **i18n SEO** | `hreflang` for uz/ru/en; default locale strategy |
| **Indexation risk** | Dashboard, auth, wallet not indexed; filter params canonicalized |
| **Content depth** | Landing explains categories; category pages have unique copy |
| **Internal linking** | Footer/nav links to high-intent pages; breadcrumbs on catalog |
| **Performance SEO** | Defer CWV fixes to `ishbor-performance-review` but flag blockers |

Checklist:
- [ ] Every public page has one H1 aligned with search intent
- [ ] Service/catalog pages server-render critical content (RSC)
- [ ] No `noindex` accidentally on marketing pages
- [ ] 404/410 handled; soft-404 empty catalogs flagged

### Phase 2 — Acquisition

Benchmark: **Upwork** role-based landing; **LinkedIn** invite quality.

| Channel | Questions |
|---------|-----------|
| Landing segmentation | Distinct paths for employer vs candidate intent? |
| UTM hygiene | Campaign params preserved through registration? |
| Sign-up source | Can attribute registration to source/channel? |
| Regional targeting | Tashkent vs viloyat messaging where relevant? |
| Trust for cold traffic | Social proof visible without login (defer detail to conversion skill) |

### Phase 3 — Activation (growth lens)

Growth cares that activation is **measurable**, not just usable (product skill owns UX).

| Event | Should exist |
|-------|--------------|
| `sign_up_complete` | role, locale, source |
| `employer_first_action` | post/browse |
| `candidate_first_listing` | service/profile live |
| `first_message_sent` | cross-side engagement |
| `first_order_started` | revenue proxy |

Flag: activation events missing, duplicated, or not tied to user id.

### Phase 4 — Retention & engagement loops

Benchmark: **Airbnb** post-trip loop; **LinkedIn** notification relevance; **Fiverr** seller re-engagement.

| Loop type | IshBor application |
|-----------|-------------------|
| **Transactional** | Order status updates → return visit |
| **Communication** | Unread messages → email/Telegram (future) |
| **Economic** | Wallet/payout triggers return |
| **Reputation** | Review request after completion |
| **Supply** | "Complete profile" / "Add second gig" nudges |
| **Demand** | "Similar talent" / "New in category" |

Checklist:
- [ ] Clear reason to return within 7 days for active users
- [ ] Email/push strategy documented (even if not built)
- [ ] Churn risks flagged: no notifications, stale catalog, dead messages
- [ ] Re-activation path for dormant users (login → dashboard prompt)

### Phase 5 — Referrals & virality

Benchmark: **Airbnb** double-sided referral; **Linear** shareable artifacts.

| Mechanic | Audit |
|----------|-------|
| Invite link | Unique code per user; lands on role-aware page |
| Incentive clarity | What inviter and invitee get (even if MVP = recognition only) |
| Share surfaces | Profile, completed order, service card share (Telegram-friendly) |
| Viral coefficient | K-factor measurable: invites sent → signups → activated |
| Fraud controls | Self-referral, multi-account abuse (coordinate with security skill) |

O'zbekiston context: Telegram share preview (OG tags), Unicode-safe URLs, mobile-first share sheet.

### Phase 6 — Growth loops map

Document closed loops explicitly:

```
Loop A (supply-led): Candidate publishes → SEO page → Employer finds → Order → Review → Candidate reputation → More inbound
Loop B (demand-led): Employer posts → Candidates apply → Hire → Completion → Employer returns
Loop C (referral): Happy user shares → New signup → Activation bonus → More supply/demand
```

Mark each loop: **working | partial | missing** with evidence.

### Phase 7 — Analytics & experimentation readiness

Benchmark: **Stripe** event clarity; **Linear** focused metrics.

- [ ] North Star metric defined (e.g. completed orders/week)
- [ ] Funnel dashboards spec'd: visit → signup → activate → transact → repeat
- [ ] Feature flags or env for experiments (optional MVP)
- [ ] Privacy: cookie/consent if tracking non-essential (uz/ru copy)

---

## Severity levels

| Level | Label | Definition |
|-------|-------|------------|
| **P0** | Blocker | Site invisible or unmeasurable (no indexation, no signup attribution, broken public URLs) |
| **P1** | Critical | Major channel broken (wrong canonicals killing SEO, referral links 404) |
| **P2** | Important | Missing loop stage limiting compounding growth |
| **P3** | Polish | Optimization (meta copy A/B, secondary hreflang) |

Include: **level**, **loop affected**, **evidence**, **estimated impact** (High/Med/Low), **fix**.

---

## Required output format

```markdown
# IshBor Growth Review — [YYYY-MM-DD]

## Executive summary
[Compounding potential, biggest leak, one loop to fix first]

## Scope
[...]

## North Star & funnel
- North Star: [metric + current if known]
- Funnel: Visit → Signup → Activate → Transact → Repeat [status per stage]

## Scorecard
| Dimension | Score (1-5) | Benchmark | Notes |
|-----------|-------------|-----------|-------|
| SEO / discoverability | | Fiverr/Upwork | |
| Acquisition attribution | | Upwork | |
| Activation measurement | | Stripe | |
| Retention loops | | Airbnb/LinkedIn | |
| Referral / virality | | Airbnb | |

## Findings
### P0 / P1 / P2 / P3 tables (ID prefix GR-###)

## Growth loop map
| Loop | Status | Broken link | Fix |
|------|--------|-------------|-----|

## SEO inventory
| URL pattern | Index? | Title unique? | Notes |
|-------------|--------|---------------|-------|

## 90-day roadmap
1. [...]

## Deferred
- Conversion psychology: [...]
- Product journeys: [...]
- Performance CWV: [...]
```

---

## Implementation authority

| Action | Authority |
|--------|-----------|
| Add/fix metadata, OG tags, sitemap, robots | **Agent may implement** |
| Add structured data to public pages | **Agent may implement** |
| Create category/region SEO landing routes | **Recommend** — confirm IA with user |
| Instrument analytics events (client) | **Agent may implement** if privacy-safe |
| Referral program economics | **Recommend only** — business decision |
| Email/Telegram notification infra | **Recommend** — backend + security review |
| Paid acquisition / ad spend | **Out of scope** — strategy only |

Do not add tracking that violates stated privacy policy or stores PII in third-party tools without review.

---

## Success metrics

| Metric | Target (6 mo post-launch) | Notes |
|--------|---------------------------|-------|
| Organic sessions share | ≥50% of non-brand traffic | Search Console |
| Indexed pages | ≥100 meaningful URLs | Sitemap + GSC |
| Signup attribution rate | ≥80% signups with known source | UTM + referrer |
| D7 retention (activated) | ≥30% | Cohort |
| D30 retention (transacted) | ≥40% | Cohort |
| Referral signup share | ≥10% of new signups | Referral table |
| Viral coefficient (K) | ≥0.15 early stage | invites × conversion |
| Repeat transaction rate | ≥25% employers/candidates at 90d | Orders |
| SEO CTR (top 10 queries) | ≥3% avg | GSC |

Growth review succeeds when **one loop closes end-to-end with metrics**, not when all channels exist.

---

## Anti-patterns

- SEO pages with duplicate boilerplate (Fiverr-style thin content penalty)
- Indexing authenticated dashboard pages
- Referral incentives before core transaction works (invites → churn)
- Vanity metrics (signups) without activation rate
- English-only meta on default `uz` site
- Growth hacks that damage trust (fake urgency counts) — escalate to conversion skill

---

## Quick invocation

*"Growth review SEO + retention"* → Phase 0 → Phases 1, 4, 6 → output template → list missing events for backend follow-up.
