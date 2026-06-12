# Marketplace Visual Redesign Report

**Date:** 2026-06-12  
**Benchmark:** Fiverr · Upwork · Kwork · Contra  
**Design read:** Trust-first freelance marketplace, Kwork-inspired card commerce + Upwork project rows + Fiverr search/header polish.

---

## Before / after screenshots

| Page | Before | After |
|------|--------|-------|
| Homepage (1280) | `before-home-desktop.png` | `after-home-desktop.png` |
| Services (1280) | `before-services-desktop.png` | `after-services-desktop.png` |
| Freelancers (1280) | `before-freelancers-desktop.png` | `after-freelancers-desktop.png` |
| Projects (1280) | `before-projects-desktop.png` | `after-projects-desktop.png` |
| Login (1280) | `before-login-desktop.png` | `after-login-desktop.png` |
| Home mobile (375) | — | `after-home-mobile.png` |
| Services mobile (375) | — | `after-services-mobile.png` |
| Services (Playwright) | — | `after-services-playwright.png` |

Path: `docs/browser-audit/redesign/`

---

## Visual audit findings (pre-redesign)

| Area | Issue | Benchmark gap |
|------|-------|---------------|
| **Header** | Flat bar, search not pill-shaped | Kwork/Fiverr use prominent rounded search |
| **Service cards** | Escrow pill competed with price; 14px title small | Kwork: price-first footer, clean image |
| **Freelancer cards** | Gray footer felt heavy, flat top | Contra/Upwork: avatar hero band |
| **Project cards** | Generic bordered box | Upwork: left accent + budget emphasis |
| **Catalog hero** | Weak gradient, low hierarchy | Kwork: bold headline + trust inline |
| **Trust strip** | Floating text, low presence | Fiverr: grouped trust badges |
| **Filters** | OK but flat shadow | Premium: elevated sticky panel |
| **Spacing** | 14px grid gap tight | Modern marketplaces: 20–22px |
| **Footer** | Plain white block | Subtle gradient grounding |

---

## Changes implemented

### New stylesheet
`src/presentation/styles/marketplace-visual-v2.css` — imported in `site-layout.tsx`

### Header & search
- Subtle dual shadow on sticky header
- Pill-shaped search (`border-radius: 999px`) with focus ring

### Catalog heroes
- Stronger gradient background
- Larger title (up to 2.125rem, weight 800)
- Trust line in pill container (escrow messaging)

### Service cards (`service-card.tsx` + CSS)
- 14px radius, layered shadow, 2px hover lift
- **Price hierarchy:** “Dan” label + 1.125rem bold price (Kwork pattern)
- Escrow moved to subtle footer hint (reduces clutter)
- Title 15px, min-height for grid alignment

### Freelancer cards (`freelancer-card.tsx` + CSS)
- Gradient header band behind avatar
- White footer (removed gray block)
- Matching card shadow/hover with services

### Project cards (CSS)
- Left accent border (3px primary on hover)
- Larger budget typography
- Elevated shadow on hover

### Discovery nav
- Active tab: filled primary pill + shadow (`jobs-discover-nav__item--active`)

### Layout & trust
- Catalog pages on `--neutral-50` canvas
- Trust strip in bordered pill bar
- Filter panel 14px radius, deeper shadow
- Results count pill styling
- Footer gradient background
- Landing hero title scale bump

---

## Lighthouse after redesign (services, mobile)

| Category | Score |
|----------|-------|
| Accessibility | 90 |
| Best Practices | 100 |
| SEO | 100 |
| Agentic Browsing | 50 |

Report: `redesign/lighthouse-services-after/report.html`

No regression vs pre-redesign services audit (A11y 90, BP 100).

---

## Remaining visual opportunities (post-launch)

| Priority | Item |
|----------|------|
| P1 | Seed quality service images — placeholder avatars limit premium feel |
| P2 | Category icon row on services (Kwork mega-menu visual density) |
| P2 | Freelancer row variant on catalog (list vs grid toggle) |
| P3 | Dark mode pass for `marketplace-visual-v2.css` |
| P3 | Payment partner logos in footer trust row |

---

## Files changed

- `src/presentation/styles/marketplace-visual-v2.css` (new)
- `src/presentation/components/layout/site-layout.tsx`
- `src/presentation/components/features/service-card.tsx`
- `src/presentation/components/features/freelancer-card.tsx`
