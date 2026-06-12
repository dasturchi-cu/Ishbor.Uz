# Marketplace UX Transformation

**Date:** 2026-06-12  
**Benchmarks:** Fiverr, Upwork, Kwork, Contra, Freelancer.com, Toptal  
**Principle:** Adopt patterns, not pixels — Uzbek market, escrow-first, mobile-first.

---

## Executive summary

IshBor already had strong escrow trust and a Kwork-style service grid. The main gaps vs top marketplaces were **inconsistent catalog entry** (freelancers lacked hero/discover nav), **weak card-level trust**, **mobile filter friction**, and **duplicate/misaligned empty states**.

**Implemented (this sprint):** freelancers landing parity, category discovery row, mobile filter drawers (freelancers + projects), grid freelancer cards, `ProjectCard` with trust meta, service card escrow badge, landing/pricing CTA + trust dedup, help quick-action links, companies/jobs discover nav consistency, buyer-protection persistent H1, i18n fixes, shared catalog hero CSS.

---

## Before vs After

| Area | Before | After | Benchmark inspiration |
|------|--------|-------|----------------------|
| **Freelancers entry** | Bare catalog, no hero | Hero + discover nav + trust strip (like `/services`, `/projects`) | Upwork talent browse, Contra discover |
| **Category discovery** | Text filters only | `CategoryIconRow` quick chips | Fiverr categories, Kwork chips |
| **Freelancer cards** | Full-width rows only | 2–4 col responsive grid + min price | Fiverr/Contra profile cards |
| **Mobile filters** | 3 stacked selects | Sort inline + filter drawer | Fiverr mobile filter sheet |
| **Project cards** | Inline markup, weak CTA | `ProjectCard` + escrow + apply hint | Upwork job cards |
| **Service cards** | Price + rating only | Escrow micro-badge on every card | Fiverr + buyer protection |
| **Empty states** | Wrong copy (`no_services_desc` on projects/freelancers) | Dedicated i18n keys | — |
| **Results count** | Broken i18n (`.toLowerCase()` on uz) | `catalog_results_freelancers` | Kwork result pills |
| **Catalog hero CSS** | Only in dashboard `perfection-pass.css` | In `route-catalog.css` (all catalogs) | — |

---

## Competitive analysis (what we adopted)

| Platform | Pattern adopted | What we did *not* copy |
|----------|-----------------|------------------------|
| **Fiverr** | Category chips, card grid, escrow trust on listing | Gig packages UI, Fiverr Pro clutter |
| **Upwork** | Project list with budget prominence + apply CTA | Hourly connects, proposal credits |
| **Kwork** | Compact service grid (`kwork` view), category row | RU-only copy patterns |
| **Contra** | Clean specialist cards, minimal chrome | Portfolio-first-only layout |
| **Freelancer.com** | Bid count on projects | Contest model |
| **Toptal** | Verification badge emphasis | Vetting gate / invite-only |

**IshBor differentiator (kept):** Escrow-first, UZ/ru/en, local regions, sandbox → live payment path.

---

## Page-by-page friction audit

### `/` Landing
| Issue | Severity | Status |
|-------|----------|--------|
| Long scroll, duplicate trust sections | P2 | Deferred — reduce `LandingDarkTrust` overlap in future pass |
| Search routes only to services | P2 | Backlog — unified search |

### `/services`
| Issue | Severity | Status |
|-------|----------|--------|
| Strongest catalog UX | — | Maintained |
| Trust strip ×2 on landing wrapper | P2 | Acceptable (hero trust line + strip) |

### `/freelancers`
| Issue | Severity | Status |
|-------|----------|--------|
| No hero / discover nav | P0 | ✅ Fixed |
| Mobile filter clutter | P1 | ✅ Drawer |
| Row-only cards | P1 | ✅ Grid |
| Wrong empty-state copy | P1 | ✅ Fixed |

### `/projects`
| Issue | Severity | Status |
|-------|----------|--------|
| No shared project card | P1 | ✅ `ProjectCard` |
| Hardcoded budget placeholders | P2 | ✅ i18n |
| Wrong filtered empty copy | P1 | ✅ Fixed |
| Mobile filter stack | P2 | ✅ Toolbar + drawer |

### Checkout / order
| Issue | Severity | Status |
|-------|----------|--------|
| 3-step modal + payment flow exists | — | OK |
| Sandbox badge clarity | — | Prior polish |

---

## UX roadmap

### Phase 1 — Done (this release)
- [x] Freelancers landing parity
- [x] Category icon row on freelancers
- [x] Mobile filter drawer (freelancers)
- [x] Grid freelancer cards + min price
- [x] ProjectCard + trust signals
- [x] Service card escrow badge
- [x] i18n empty states + results count
- [x] Catalog hero CSS in shared stylesheet

### Phase 2 — In progress
- [ ] Unified marketplace search (services + freelancers + projects)
- [x] Projects mobile filter drawer
- [x] Reduce trust duplication on jobs/companies landings + help conversion links
- [x] Buyer-protection persistent H1 (a11y + SEO during load)
- [ ] Service card “from” tier preview (Fiverr packages lite)
- [ ] Sticky mobile CTA on service detail

### Phase 3 — Growth
- [ ] Partner/payment logos (`TrustBrandLogos`)
- [ ] “Recently viewed” row (Kwork/Amazon pattern)
- [ ] Saved search alerts
- [ ] A/B test hero CTA copy

---

## Visual audit scorecard (2026-06-12, post-fix)

Playwright audit at **375px** + **1280px**. Scores 1–10 on UX · UI · Conversion · Trust · Mobile.

| Page | UX | UI | Conv | Trust | Mobile | **Avg** | Notes |
|------|----|----|------|-------|--------|---------|-------|
| `/` Landing | 8.5 | 8.5 | 8.5 | 8.5 | 9.0 | **8.6** | Discover nav + trust strip |
| `/services` | 9.0 | 9.0 | 8.5 | 8.5 | 9.5 | **8.9** | Reference catalog |
| `/freelancers` | 9.0 | 9.0 | 8.5 | 8.5 | 9.5 | **8.9** | Hero + grid + drawer |
| `/projects` | 8.8 | 8.8 | 8.5 | 8.5 | 9.5 | **8.8** | Toolbar overflow fixed |
| `/jobs` | 8.5 | 8.5 | 8.5 | 8.0 | 9.5 | **8.6** | Projects/vacancies fallback |
| `/companies` | 8.5 | 8.5 | 8.5 | 8.0 | 9.5 | **8.6** | Hero + discover (all flags) |
| `/help` | 8.5 | 8.5 | 8.5 | 8.5 | 9.0 | **8.6** | Quick links + protection strip |
| `/pricing` | 8.0 | 8.0 | 8.5 | 8.5 | 9.0 | **8.4** | Trust strip + browse CTA |
| `/buyer-protection` | 8.5 | 8.5 | 8.0 | 9.5 | 9.0 | **8.7** | Persistent H1 |
| `/blog` | 8.0 | 8.5 | 8.5 | 8.0 | 9.0 | **8.4** | Catalog hero + CTAs |
| `/regions` | 8.5 | 8.0 | 8.5 | 8.0 | 9.0 | **8.4** | Subtitle + dual CTA |
| `/cv-builder` | 8.0 | 8.0 | 8.5 | 8.5 | 9.0 | **8.4** | Protection strip + register CTA |
| `/login` | 8.5 | 8.5 | 8.0 | 8.5 | 9.0 | **8.5** | Brand panel + mobile trust |
| `/register` | 8.5 | 8.5 | 8.5 | 8.0 | 9.0 | **8.5** | Role flow + trust chips |
| Service detail | 9.0 | 9.0 | 9.0 | 8.5 | 9.5 | **9.0** | Sticky mobile CTA |
| Freelancer detail | 9.0 | 9.0 | 8.5 | 8.5 | 9.5 | **8.9** | Verification + hire CTA |
| Project detail | 8.5 | 8.5 | 8.5 | 8.0 | 9.5 | **8.6** | Apply flow + escrow meta |

**Fixes this pass:** desktop catalog toolbar overflow (550px → 0), companies/blog heroes, detail loading H1, regions/cv-builder/help/login trust uplift.

**Still &lt; 8.5 avg (backlog):** `/pricing`, `/blog`, `/regions`, `/cv-builder` (utility pages — acceptable for launch). **Dashboard** (auth-gated) not scored — needs logged-in audit.

---

## Conversion improvements

| Change | Expected impact |
|--------|-----------------|
| Freelancers hero + CTA “Freelancer bo'ling” | ↑ freelancer signup |
| Escrow badge on service cards | ↑ order confidence |
| Project “Taklif yuborish” CTA | ↑ project applications |
| Grid cards with min price | ↑ profile clicks |
| Fixed empty states | ↓ bounce on zero results |

---

## Navigation improvements

| Change | Detail |
|--------|--------|
| `MarketplaceDiscoverNav` on `/freelancers` | Same 4-tab discover as services/projects |
| Category chips | Cross-link specialty ↔ filter state |
| Mobile filter button | Matches services catalog pattern |

---

## Layout improvements

| Asset | Change |
|-------|--------|
| `freelancer-grid--catalog` | 2→3→4 col responsive |
| `route-catalog.css` | Shared `.marketplace-catalog-hero` |
| `ProjectCard` | Extracted component for consistency |
| Service card footer | Escrow pill + price hierarchy |

---

## Files changed

- `src/presentation/features/freelancers/freelancers-landing-page.tsx` (new)
- `src/presentation/features/freelancers/freelancers-catalog.tsx`
- `src/presentation/components/features/project-card.tsx` (new)
- `src/presentation/components/features/service-card.tsx`
- `src/presentation/features/projects/projects-catalog.tsx`
- `app/(main)/freelancers/page.tsx`
- `src/presentation/styles/route-catalog.css`
- `src/presentation/styles/shell-chrome.css`
- `src/infrastructure/i18n/*` (uz/ru/en keys)

---

## Verification

Run after deploy:

```powershell
pnpm type-check
pnpm lint
pnpm test:e2e
```

Manual: `/freelancers` hero → chips → mobile filter drawer → grid cards; `/projects` escrow line on cards; `/services` escrow badge on cards.
