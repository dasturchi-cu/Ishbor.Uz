# Visual Issues Report

**Date:** 2026-06-12  
**Viewports:** 375×812 (mobile), 768×1024 (tablet), 1280×800 (desktop)  
**Screenshots:** [`screenshots/`](./screenshots/)

---

## Summary

| Category | Issues found |
|----------|--------------|
| Horizontal overflow | **0** |
| Broken images | **0** |
| Empty unlabeled buttons | **0** |
| Stuck loading states | **0** |
| Layout regressions | **0** critical |
| Content / trust visual | **2** (catalog thin, junk title) |
| Accessibility visuals | **4** (contrast, labels, headings) |

---

## Screenshots index

### Public catalog routes

| Page | Mobile | Tablet | Desktop |
|------|--------|--------|---------|
| Homepage | `homepage-mobile.png` | `homepage-tablet.png` | `homepage-desktop.png` |
| Services | `services-mobile.png` | `services-tablet.png` | `services-desktop.png` |
| Freelancers | `freelancers-mobile.png` | `freelancers-tablet.png` | `freelancers-desktop.png` |
| Projects | `projects-mobile.png` | `projects-tablet.png` | `projects-desktop.png` |
| Jobs | `jobs-mobile.png` | `jobs-tablet.png` | `jobs-desktop.png` |
| Companies | `companies-mobile.png` | `companies-tablet.png` | `companies-desktop.png` |

### Auth

| Page | Mobile | Tablet | Desktop |
|------|--------|--------|---------|
| Login | `login-mobile.png` | `login-tablet.png` | `login-desktop.png` |
| Register | `register-mobile.png` | `register-tablet.png` | `register-desktop.png` |

### Protected (guest → login redirect)

| Intended route | Screenshot shows login form |
|--------------|----------------------------|
| Dashboard | `dashboard-*.png` |
| Messages | `messages-*.png` |
| Wallet | `wallet-*.png` |
| Settings | `settings-*.png` |
| Admin | `admin-*.png` |

### Checkout

| Viewport | File |
|----------|------|
| Mobile | `checkout-mobile.png` |
| Tablet | `checkout-tablet.png` |
| Desktop | `checkout-desktop.png` |

### Chrome DevTools captures

- `devtools-login-mobile.png`
- `devtools-projects-mobile.png`

---

## Issue catalog

### VI-001 — Thin services catalog (P1 · Content)

**Pages:** `/services` (all viewports)  
**Observation:** Catalog shows **one service** with junk title **"sddsads"**. Layout and grid work; marketplace looks empty/unprofessional.  
**Screenshot:** `services-desktop.png`, `checkout-mobile.png`  
**Fix:** Seed 5–10 approved services; purge junk rows from DB.

---

### VI-002 — Service detail title in checkout (P1 · Content)

**Page:** `/services/{id}` + checkout modal  
**Observation:** Page title and modal header use raw DB title `sddsads — IshBor.uz`.  
**Screenshot:** `checkout-mobile.png`  
**Fix:** Same as VI-001; moderation + quality gate on publish.

---

### VI-003 — Landing hydration flash risk (P1 · Rendering)

**Page:** `/`  
**Observation:** Chrome DevTools reports SSR/client HTML mismatch in `LandingPage` (Suspense boundary vs layout container). May cause brief layout shift or re-render flash in dev; Lighthouse logged console error.  
**CLS measured:** 0.06 (within “good” &lt; 0.1, but improve)  
**Fix:** Align server and client markup in `landing-sections.tsx`; avoid client-only wrappers that change DOM structure on hydrate.

---

### VI-004 — Low contrast text (P2 · A11y visual)

**Pages:** `/`, `/services`  
**Lighthouse:** `color-contrast` failed  
**Observation:** Muted helper text, chips, or secondary labels below WCAG AA contrast on mobile.  
**Fix:** Audit `--ishbor-text-muted` and filter chip colors against background tokens.

---

### VI-005 — Sort `<select>` without visible label (P2 · A11y visual)

**Page:** `/services`  
**Lighthouse:** `select-name` failed  
**Observation:** Sort dropdown (“Eng mashhur”) lacks programmatic label association.  
**Fix:** Add `<label>` or `aria-label` on services catalog sort control.

---

### VI-006 — Heading hierarchy skip (P2 · A11y visual)

**Pages:** `/`, `/services`  
**Lighthouse:** `heading-order` failed  
**Observation:** Heading levels skip (e.g. `h1` → `h3` without `h2`).  
**Fix:** Normalize section headings in catalog and landing sections.

---

### VI-007 — Label / accessible name mismatch (P2 · A11y visual)

**Pages:** `/`, `/services`  
**Lighthouse:** `label-content-name-mismatch`  
**Observation:** Visible text on search or icon buttons does not match `aria-label` / computed name.  
**Fix:** Align i18n visible strings with `aria-label` on header search and filter controls.

---

### VI-008 — Projects client warning (P3 · Rendering)

**Page:** `/projects`  
**Observation:** Console warn `[IshBor client error] [object Object]` — no visible broken layout in screenshot; possible silent API/client handling issue.  
**Screenshot:** `devtools-projects-mobile.png`  
**Fix:** Log structured error; verify projects list API on cold load.

---

## Layout verification matrix

| Check | 320 | 375 | 768 | 1024 | 1280 | 1920 |
|-------|-----|-----|-----|------|------|------|
| Horizontal overflow | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `main` landmark | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Skip link (public) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mobile drawer width | ✅ | ✅ | — | — | — | — |
| Bottom nav touch ≥44px | ✅ | ✅ | — | — | — | — |

Source: `scripts/tools/mobile-overflow-audit.mjs` + per-page Playwright audit.

---

## What looks good

- Consistent header, footer, and marketplace discover nav across routes
- Trust/escrow strips visible on catalog pages
- Login/register forms centered, readable at all breakpoints
- Guest checkout modal overlays service detail cleanly (mobile included)
- No broken image placeholders in audited routes
- Auth redirects preserve `returnTo` — login form fills viewport correctly

---

## Recommended visual QA before launch

1. Re-screenshot all routes **after** catalog seeding
2. Logged-in dashboard sidebar + wallet + messages at 375px
3. Admin moderation table at 1280px
4. Compare production build (not dev) — dev hydration warnings may differ
