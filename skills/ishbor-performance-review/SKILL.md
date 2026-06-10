---
name: ishbor-performance-review
description: >-
  IshBor.uz performance audit — bundle size, Core Web Vitals, React rendering,
  lazy loading, caching, database efficiency. Use when reviewing speed, Lighthouse,
  or comparing IshBor perf to Linear, Stripe dashboard, and marketplace catalog UX.
disable-model-invocation: true
---

# IshBor Performance Review

Performance audit for IshBor.uz. Benchmark bar: **Linear** (instant app feel), **Stripe Dashboard** (dense UI still fast), **Fiverr** (image-heavy catalog acceptable LCP), **Airbnb** (search/filter responsiveness).

**Out of scope:** SEO strategy (`ishbor-growth-review`), conversion copy (`ishbor-conversion-review`), auth/RLS (`ishbor-security-review`), product journey gaps (`ishbor-product-review`).

---

## Purpose

Ensure IshBor feels **fast on real Uzbekistan networks and devices**, not just on developer laptops. Performance review answers: *"What blocks rendering, interaction, and data—and what is the cheapest fix?"*

Primary outcomes:
- Core Web Vitals within Google "Good" thresholds on key pages
- Controlled JavaScript bundle growth on dashboard routes
- Efficient React rendering (no avoidable re-render storms)
- Server/API/DB paths that scale with catalog and order volume

---

## Context

### Read before auditing

| Order | File | Why |
|-------|------|-----|
| 1 | [AGENTS.md](../../AGENTS.md) | Stack: Next.js 16, React 19, Tailwind 4 |
| 2 | `next.config.*` | Images, bundles, experimental flags |
| 3 | `app/` layouts | Server vs client component boundaries |
| 4 | [design/figma-tokens.json](../../design/figma-tokens.json) | Font/asset loading |
| 5 | Backend query patterns | N+1, missing indexes |

### Target pages (priority)

| Page | Why |
|------|-----|
| `/` landing | LCP, first impression |
| `/services` catalog | List virtualization, images, filters |
| `/login`, `/register` | INP on forms |
| `/dashboard/*` | Bundle size, hydration |
| Service detail | LCP image, CLS |
| Messages (if live) | Realtime + list perf |

### Environment rules (AGENTS.md)

- Do **not** start dev servers unless user asks
- Use `pnpm dev:status` before suggesting restarts
- Validate with `pnpm build`, Lighthouse, and `npx tsc --noEmit` when appropriate

### Budgets (mobile 4G, mid-tier Android)

| Metric | Good | Investigate | Poor |
|--------|------|-------------|------|
| **LCP** | ≤2.5s | 2.5–4s | >4s |
| **INP** | ≤200ms | 200–500ms | >500ms |
| **CLS** | ≤0.1 | 0.1–0.25 | >0.25 |
| **TTFB** | ≤800ms | 800ms–1.8s | >1.8s |
| **JS (gzip) initial** | ≤150KB | 150–250KB | >250KB |
| **Total page weight** | ≤1.5MB | 1.5–3MB | >3MB |

---

## Audit framework

### Phase 0 — Scope declaration

```
Pages tested: [...]
Device profile: [mobile 4G | desktop | both]
Build mode: [production build required for bundle audit]
Data mode: [mock | API | CDN]
Known regressions: [...]
```

### Phase 1 — Measurement baseline

Run before recommendations:

1. `pnpm build` — note route sizes from output
2. Lighthouse (Chrome) on priority pages — mobile preset
3. Record LCP element, CLS sources, long tasks
4. Network waterfall: document blocking resources

If server not running, analyze static bundle via build output + code review; state limitation in report.

### Phase 2 — Bundle size & code splitting

Benchmark: **Linear** — route-level splitting, minimal global client JS.

| Check | Standard |
|-------|----------|
| Route bundles | Dashboard code not in landing bundle |
| `'use client'` boundary | Client islands only where needed |
| Barrel imports | No `import from '@/presentation'` mega barrels |
| Heavy libs | Charts, maps, editors lazy-loaded |
| Tree shaking | No full lodash/moment imports |
| Duplicates | Single React, single motion lib |
| Third-party | Analytics deferred until after LCP |

Inspect: `package.json`, dynamic `import()`, `next/dynamic` usage.

**Flags:**
- Entire `app-provider` client-wrapping static pages
- Lucide/motion importing full icon sets
- Supabase client in server components incorrectly forcing client bundles

### Phase 3 — Core Web Vitals

#### LCP
- Hero/image: `next/image` with `priority` on above-fold
- Correct `sizes` attribute
- No render-blocking fonts (use `next/font`)
- Server-render critical HTML (RSC default)

#### INP
- Debounce expensive filter inputs
- No synchronous heavy work on click handlers
- Web Workers for rare heavy tasks only
- Avoid re-render on every keystroke in large lists

#### CLS
- Explicit width/height on images and embeds
- Reserve skeleton space for async content
- No late-injected banners above content
- Font fallback metrics (`size-adjust`)

### Phase 4 — React rendering

Benchmark: **Stripe** tables — stable row keys, memo where measured.

| Pattern | Prefer | Avoid |
|---------|--------|-------|
| Lists | Virtualization for >50 rows | Map 500 cards naively |
| Context | Split contexts by domain | One giant AppContext |
| State | Local state; URL for filters | Global state for form fields |
| Memo | After profiler proof | Blanket `memo` everywhere |
| Effects | Strict deps + cleanup | Polling without backoff |
| Realtime | Targeted subscriptions | Whole-table listen |

Tools: React DevTools Profiler (when server available), code review for obvious issues.

### Phase 5 — Lazy loading & assets

| Asset type | Strategy |
|------------|----------|
| Images | WebP/AVIF via Next Image; lazy below fold |
| Fonts | `next/font`, subset Latin + Cyrillic if needed |
| Modals/drawers | Dynamic import on open |
| Maps/charts | Dynamic import |
| i18n | Load active locale; split dictionaries if large |
| Videos | Poster + lazy; no autoplay blocking LCP |

Check [globals.css](../../app/globals.css) and [tokens.css](../../src/presentation/styles/tokens.css) for oversized unused CSS.

### Phase 6 — Caching strategy

| Layer | Audit |
|-------|-------|
| **Next.js** | `fetch` cache/revalidate tags on catalog |
| **Static assets** | Long cache headers on `_next/static` |
| **API (FastAPI)** | Cache-Control on public read endpoints |
| **CDN** | Image CDN configuration |
| **Browser** | SWR/React Query stale times documented |
| **Supabase** | Realtime only where needed; not duplicate polling |

Flag: client refetching full catalog on every navigation; no `revalidate` on semi-static pages.

### Phase 7 — Database & API efficiency

Benchmark: **Fiverr** search — indexed filters; **Upwork** — paginated results.

| Check | Standard |
|-------|----------|
| Pagination | Cursor/limit on all lists |
| N+1 queries | Eager load relations in ORM |
| Indexes | Filter columns: category, region, status, user_id |
| Select columns | No `SELECT *` on wide tables |
| Aggregates | Precompute ratings counts if hot path |
| Connection pool | Pool size configured for deploy target |
| Slow query log | >100ms queries flagged |

Review backend list endpoints and Supabase queries used for realtime only.

### Phase 8 — Mobile & network realism

- Test 375px viewport; touch targets ≥44px (product overlap OK)
- Simulate Slow 4G in DevTools
- Reduce motion respects `prefers-reduced-motion` (no perf hit from disabled anim)
- Uzbekistan context: international CDN latency; minimize round trips

---

## Severity levels

| Level | Label | Definition |
|-------|-------|------------|
| **P0** | Blocker | LCP >4s or INP >500ms on primary landing/catalog on mid mobile |
| **P1** | Critical | Fails "Good" CWV on 2+ priority pages |
| **P2** | Important | Measurable waste (>100KB avoidable JS, N+1 queries) |
| **P3** | Polish | Micro-optimizations without user-visible gain |

Prefix findings **PERF-###**. Include **estimated impact** (ms or KB saved).

---

## Required output format

```markdown
# IshBor Performance Review — [YYYY-MM-DD]

## Executive summary
[Overall: Good / Needs work / Poor]
[Top 3 wins by impact/effort]

## Scope & methodology
[Build hash, pages, device, limitations]

## Core Web Vitals
| Page | LCP | INP | CLS | TTFB | Pass? |
|------|-----|-----|-----|------|-------|

## Bundle report
| Route | First Load JS | Notes |
|-------|---------------|-------|

## Findings
### P0 / P1 / P2 / P3 (PERF-###)

## React hotspots
[Component | issue | fix]

## Caching & API
[...]

## DB queries flagged
[...]

## Roadmap (impact × effort)
| Fix | Impact | Effort | Owner |
|-----|--------|--------|-------|

## Deferred
- SEO: [...]
- Conversion: [...]
```

---

## Implementation authority

| Action | Authority |
|--------|-----------|
| Add `next/image`, `priority`, `sizes` | **Agent may implement** |
| Split client components / dynamic import | **Agent may implement** |
| Add DB index (migration) | **Agent may implement** with backend review |
| Change caching/revalidate strategy | **Agent may implement** — note stale data tradeoff |
| Introduce virtualization library | **Agent may implement** if dependency approved |
| CDN/infra changes | **Recommend** — ops decision |
| Remove feature for perf | **Recommend only** |

Measure before and after when server available; cite delta in PR description.

---

## Success metrics

| Metric | Target | Page |
|--------|--------|------|
| LCP | ≤2.5s p75 | Landing, catalog, service detail |
| INP | ≤200ms p75 | Register, catalog filter, dashboard nav |
| CLS | ≤0.1 p75 | All priority |
| Landing First Load JS | ≤150KB gzip | `/` |
| Dashboard route JS | ≤200KB gzip | `/dashboard/*` |
| API p95 list latency | ≤300ms | `/services`, orders |
| DB slow queries | 0 >100ms at 1k rows | Backend |
| Lighthouse Performance | ≥85 mobile | Landing |
| Build time regression | <10% increase sprint-over-sprint | CI |

Performance review succeeds when **one priority page moves from Poor → Good** with evidence, not when every micro-opt is listed.

---

## Anti-patterns

- Optimizing hero animation before fixing 400KB dashboard bundle
- `window.addEventListener('scroll')` driving React state (see taste-skill ban)
- Client-fetching entire catalog without pagination
- Unoptimized PNG heroes
- Disabling ESLint instead of fixing imports
- Caching personalized dashboard responses publicly

---

## Quick invocation

*"Performance review landing + services"* → `pnpm build` → Phase 1-3, 5, 7 → CWV table → PERF findings → roadmap sorted by impact/effort.
