# Performance Report

**Date:** 2026-06-12  
**Environment:** Local dev (`127.0.0.1:3000`)  
**Tools:** Chrome DevTools MCP `performance_start_trace`, `lighthouse_audit`

---

## Core Web Vitals (lab)

Measured on **homepage** `/` — mobile viewport, cold navigation, CPU 1×, no network throttling.

| Metric | Value | Rating | Target |
|--------|-------|--------|--------|
| **LCP** | **1,283 ms** | Good | ≤ 2,500 ms |
| **CLS** | **0.061** | Good | ≤ 0.1 |
| **INP** | *Not measured* | — | ≤ 200 ms |
| **TTFB** | 81 ms | Good | ≤ 800 ms |

### LCP breakdown (homepage)

| Phase | Time | % of LCP |
|-------|------|----------|
| Time to First Byte | 81 ms | 6.3% |
| Element render delay | 1,202 ms | 93.7% |

- **LCP element:** `h1.landing-hero-title` (text, not an image)
- **Bottleneck:** Client-side render/hydration delay, not network fetch for LCP resource
- **Insight:** `RenderBlocking` — estimated LCP savings **0 ms** (minimal render-blocking CSS/JS in critical path)

### CLS

- Score **0.061** — within “good” threshold
- Culprits likely late-loading sections (testimonials, featured freelancers) — see `CLSCulprits` insight in trace
- Related visual issue: landing hydration mismatch may contribute to minor shift

### INP

**Not captured** in this passive navigation trace. INP requires real user interaction (click, tap, keypress). Recommend:

1. Chrome DevTools → Performance → interact with search/filter after load  
2. Post-launch: CrUX field data in Search Console  

**Proxy:** Login page Lighthouse **Agentic Browsing 100** suggests interactive controls are well-labeled; homepage **49** indicates automation struggles with unlabeled controls (aligns with a11y label issues).

---

## Lighthouse scores (mobile)

Lighthouse performance category is **excluded** from Chrome DevTools MCP `lighthouse_audit` — use performance trace for CWV. Category scores below:

### Homepage `/`

| Category | Score |
|----------|-------|
| Accessibility | **95** |
| Best Practices | **96** |
| SEO | **100** |
| Agentic Browsing | **49** |

**Failed audits (material):**

- `errors-in-console` — hydration error
- `color-contrast`
- `heading-order`
- `label-content-name-mismatch`
- Agentic: accessibility tree not well-formed

Report: `lighthouse-home-mobile/report.html`

---

### Services `/services`

| Category | Score |
|----------|-------|
| Accessibility | **90** |
| Best Practices | **100** |
| SEO | **100** |
| Agentic Browsing | **50** |

**Additional failures vs home:**

- `select-name` — sort dropdown unlabeled

Report: `lighthouse-services-mobile/report.html`

---

### Login `/login`

| Category | Score |
|----------|-------|
| Accessibility | **100** |
| Best Practices | **100** |
| SEO | **100** |
| Agentic Browsing | **100** |

**Failed audits:** none  
Report: `lighthouse-login-mobile/report.html`

---

## Network performance (browser-observed)

| Page | Material failures | Notes |
|------|-------------------|-------|
| All public routes | 0 | APIs return 200 via Next proxy |
| Checkout | 3× `ERR_ABORTED` | Analytics view beacon aborted on navigation — no user impact |
| Dashboard (guest) | 0 | Redirect to login before heavy dashboard API |

**API latency (informal):** TTFB 81 ms on homepage — backend responsive in local dev.

---

## Playwright load audit aggregates

From 42 automated page loads:

| Metric | Value |
|--------|-------|
| Navigation errors | 0 |
| Stuck “Yuklanmoqda…” | 0 |
| Overflow issues | 0 |
| Console errors | 0 |

---

## Performance risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| LCP render delay 1.2s on landing | Medium | Reduce client JS on hero; fix hydration; consider SSR for below-fold sections |
| Dev mode overhead | Medium | Re-measure on **production build** — dev React/HMR inflates render delay |
| No CDN for API | Low | Production deploy + edge caching for static assets |
| Redis absent | Low | Add `REDIS_URL` if rate-limit DB pressure under load |
| No Lighthouse CI | Low | Add `lighthouserc.cjs` mobile preset to CI |

---

## Recommendations (priority)

### Before launch

1. **Production build audit** — run same trace on `pnpm build && pnpm start` (not `next dev`)
2. **Fix landing hydration** — should reduce render delay and console errors
3. **Hero LCP** — ensure hero `h1` text is in initial HTML without waiting for client bundles

### After launch

4. Enable **CrUX** monitoring in Search Console  
5. Add **Lighthouse CI** on `/`, `/services`, `/login` per deploy  
6. Profile **logged-in dashboard** — heavier JS (charts, realtime) not measured here  
7. Capture **INP** with field data or scripted interaction trace

---

## Trace artifact

| File | Description |
|------|-------------|
| `trace-home-mobile.json.json.gz` | Full Chrome performance trace (LCP, CLS insights) |

### Available trace insights

- `LCPBreakdown` — render delay dominant  
- `CLSCulprits` — layout shift sources  
- `RenderBlocking` — minimal impact  
- `NetworkDependencyTree` — chain depth acceptable  
- `ForcedReflow` — minor main-thread reflow events  

---

## Scorecard vs targets

| Area | Lab result | Launch ready? |
|------|------------|---------------|
| LCP | 1.28s | ✅ Yes (re-test prod build) |
| CLS | 0.06 | ✅ Yes |
| INP | N/A | ⚠️ Measure post-deploy |
| SEO (Lighthouse) | 100 | ✅ Yes |
| Best Practices | 96–100 | ✅ Yes |
| Accessibility | 90–100 | ⚠️ Fix catalog issues |
| API reliability | No 5xx | ✅ Yes |
