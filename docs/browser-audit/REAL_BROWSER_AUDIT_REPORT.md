# Real Browser Audit Report

**Date:** 2026-06-12  
**Environment:** `http://127.0.0.1:3000` (Next.js dev) + `http://127.0.0.1:8002` (FastAPI)  
**Tools:** Playwright (headless Chromium audit script), Chrome DevTools MCP (Lighthouse, performance trace, console, network)  
**Raw data:** [`audit-raw.json`](./audit-raw.json) · **Screenshots:** [`screenshots/`](./screenshots/)

---

## Executive summary

| Metric | Result |
|--------|--------|
| Pages audited | 14 routes × 3 viewports (375 / 768 / 1280) = **42 loads** + checkout modal |
| Navigation failures | **0** |
| Console errors (Playwright sweep) | **0** |
| Console errors (Chrome DevTools — homepage SPA nav) | **1** hydration mismatch |
| Horizontal overflow | **0** issues (extended audit: 12 routes × 10 widths) |
| Protected-route redirects | **Correct** (dashboard, messages, wallet, settings, admin → login) |
| Checkout modal (guest) | **Opens** on all viewports |
| API 4xx/5xx (material) | **None** observed |

**Verdict:** Guest-facing routes are **stable in the browser**. Fix hydration warning on landing, catalog a11y contrast/labels, and seed real catalog content before marketing launch. Authenticated dashboard/admin UI was **not** exercised (no session cookie in this audit).

---

## Methodology

For each page:

1. Open URL in fresh Playwright context  
2. Capture `console` errors/warnings and `pageerror`  
3. Capture `requestfailed` and API responses ≥ 400  
4. Evaluate DOM: overflow, broken images, empty buttons, `main` landmark, skip link, stuck loading  
5. Screenshot viewport  
6. Chrome DevTools MCP: Lighthouse (mobile) on `/`, `/services`, `/login`; performance trace on `/`  

---

## Page-by-page results

Legend: ✅ Pass · ⚠️ Warning · ❌ Fail · 🔒 Redirect (guest)

| Page | Mobile | Tablet | Desktop | Console | Network | Notes |
|------|--------|--------|---------|---------|---------|-------|
| **Homepage** `/` | ✅ | ✅ | ✅ | ⚠️ hydration (CDP) | ✅ | Lighthouse A11y 95 |
| **Services** `/services` | ✅ | ✅ | ✅ | ✅ | ✅ | 1 public service card; A11y 90 |
| **Freelancers** `/freelancers` | ✅ | ✅ | ✅ | ✅ | ✅ | Catalog renders |
| **Projects** `/projects` | ✅ | ✅ | ✅ | ⚠️ client warn (CDP) | ✅ | `[IshBor client error]` object |
| **Jobs** `/jobs` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| **Companies** `/companies` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| **Login** `/login` | ✅ | ✅ | ✅ | ✅ | ✅ | Lighthouse 100 all categories |
| **Register** `/register` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| **Dashboard** `/dashboard` | 🔒 | 🔒 | 🔒 | ✅ | ✅ | → `/login?returnTo=/dashboard` |
| **Messages** `/dashboard/messages` | 🔒 | 🔒 | 🔒 | ✅ | ✅ | → login with returnTo |
| **Wallet** `/dashboard/wallet` | 🔒 | 🔒 | ✅ | ✅ | ✅ | → login with returnTo |
| **Settings** `/dashboard/settings` | 🔒 | 🔒 | 🔒 | ✅ | ✅ | → login with returnTo |
| **Admin** `/admin` | 🔒 | 🔒 | 🔒 | ✅ | ✅ | → login (guest) |
| **Checkout** (service detail modal) | ✅ | ✅ | ✅ | ✅ | ⚠️ | Modal opens; view beacon aborted |

### Checkout detail

- Service: `/services/1808158e-0cb4-42dc-be5c-bf1ba3d9e948` (title **"sddsads"** — content quality issue)
- Guest checkout dialog: **visible** on mobile, tablet, desktop
- Network: `POST …/services/{id}/view` → `net::ERR_ABORTED` (navigation abort, not server error)

### Protected routes (guest)

All dashboard and admin paths correctly redirect to login with `returnTo` query preserved. Screenshots show login form, not a broken blank dashboard.

---

## Console findings

### Playwright automated sweep (42 loads)

**No errors or warnings** captured across all public and redirect routes.

### Chrome DevTools MCP (targeted)

| Page | Severity | Message |
|------|----------|---------|
| `/` (after client navigation) | **Error** | React hydration mismatch — `LandingPage` tree differs SSR vs client (`<Suspense>` vs `<div className="layout-container…">`) |
| `/` | Issue | Form fields missing `id` or `name` (count: 2) |
| `/projects` | **Warn** | `[IshBor client error] [object Object]` — opaque client error log |
| `/services` | ✅ | Clean |
| `/login` | ✅ | Clean |

**Action:** Investigate `landing-sections.tsx` / landing layout for hydration-safe rendering (defer client-only blocks, consistent SSR markup).

---

## Network findings

| Type | Count | Detail |
|------|-------|--------|
| API 4xx/5xx | **0** | All `/api/v1/*` requests returned 200 or 401 as expected |
| Aborted requests | **3** | `POST /api/v1/services/{id}/view` during checkout flow — benign `ERR_ABORTED` |
| Failed document loads | **0** | All pages HTTP 200 |

Sample successful API calls (Chrome DevTools on `/`):

- `GET /api/v1/reviews/recent?limit=3` → 200

---

## Accessibility (browser-verified)

| Check | Homepage | Services | Login |
|-------|----------|----------|-------|
| Skip link | ✅ | ✅ | ✅ |
| `main` / `#main-content` | ✅ | ✅ | ✅ |
| Single `h1` | ✅ | ✅ | ✅ |
| Lighthouse Accessibility | 95 | 90 | **100** |

**Recurring Lighthouse failures (home + services):**

- Color contrast insufficient (muted text / chips)
- Heading order not sequential
- Visible label ≠ accessible name (search / nav controls)
- `<select>` without associated label (services sort dropdown)
- Agentic browsing tree malformed (score 49–50)

---

## Responsiveness

Extended overflow audit (`mobile-overflow-audit.mjs`): **12 routes × widths 320–1920** — **no overflow**, no undersized bottom-nav targets, no category nav on mobile.

All 14 audited routes: `scrollWidth === clientWidth` at 375, 768, 1280.

---

## Not tested in this audit

| Area | Reason |
|------|--------|
| Logged-in dashboard UI | No authenticated session |
| Admin panel UI | No `is_admin` session |
| Full payment completion | Sandbox flow not clicked through |
| WebRTC video room | Out of scope |
| INP (interaction) | Requires input trace — see Performance Report |

---

## Priority fixes (browser-verified)

| P | Issue | Evidence |
|---|-------|----------|
| **P1** | Landing hydration mismatch | Chrome DevTools console on `/` |
| **P1** | Junk service title in checkout (`sddsads`) | Checkout screenshot + page title |
| **P2** | Services catalog a11y (contrast, select label, heading order) | Lighthouse services mobile |
| **P2** | Projects page client error warn | Chrome DevTools on `/projects` |
| **P2** | Re-audit dashboard/admin **logged in** before launch | Not covered here |

---

## Artifacts

| Artifact | Path |
|----------|------|
| Raw JSON | `docs/browser-audit/audit-raw.json` |
| Screenshots (42 + CDP) | `docs/browser-audit/screenshots/*.png` |
| Lighthouse home | `docs/browser-audit/lighthouse-home-mobile/` |
| Lighthouse services | `docs/browser-audit/lighthouse-services-mobile/` |
| Lighthouse login | `docs/browser-audit/lighthouse-login-mobile/` |
| Performance trace | `docs/browser-audit/trace-home-mobile.json.json.gz` |
