# P1 Marketplace Flow Fixes — Verification Report

**Date:** 2026-06-12  
**Scope:** BUG-004, BUG-005, BUG-006, BUG-008  
**Environment:** `http://127.0.0.1:3000` + `http://127.0.0.1:8002`, Supabase `cixtesdcklcuxhviemnf`

---

## Summary

| Bug | Status | Verification |
|-----|--------|--------------|
| BUG-004 `/projects/new` route conflict | **Fixed** | Playwright + MCP redirect to `/post-project` |
| BUG-005 Duplicate project creation | **Fixed** | Submit lock + idempotency + `maxAttempts: 1` |
| BUG-006 Services catalog intermittent failure | **Fixed** | Playwright 3× guest load, no backend error |
| BUG-008 Dashboard empty after create | **Fixed** | Cache invalidation + `refetchOnMount` |

---

## Root Causes

### BUG-004 — `/projects/new` treated as project ID

**Root cause:** Next.js App Router matched `/projects/new` to dynamic `projects/[id]` with `id="new"`, triggering `GET /api/v1/projects/new` and infinite loading.

**Fix:**
- Static route `app/(main)/projects/new/page.tsx` → redirect `/post-project`
- `next.config.mjs` permanent redirect
- `isReservedProjectSlug()` guard in `[id]/page.tsx`

### BUG-005 — Duplicate rows on single submit

**Root cause (multi-factor):**
1. `apiFetch` default `maxAttempts: 2` retried POST on timeout/network error after server had already created the row
2. No frontend submit lock — rapid double-click could fire twice
3. Idempotency middleware did not cover `POST /api/v1/projects`

**Fix:**
- `createProject`: `maxAttempts: 1`, `Idempotency-Key` header
- Backend idempotency route for `/api/v1/projects`
- `submitLockRef` + stable idempotency key in `post-project.tsx`

### BUG-006 — Services catalog intermittent "Backend javob bermadi"

**Root cause:** `useEffect` fetch loop — successful `listServices` response updated `priceRange`/`priceCeiling`, which was in effect deps, causing immediate re-fetch. Overlapping requests aborted each other (`net::ERR_ABORTED`).

**Fix:**
- `AbortController` cleanup per effect run
- `priceFilterTick` — only user slider changes trigger price refetch
- Ignore aborted request errors in catch

### BUG-008 — Dashboard empty after project create

**Root cause:** `useDashboardSummary` served stale `sessionStorage` cache (`projects: []`) with `refetchOnMount: false` and `staleTime: 60s`. New project not shown until cache expired.

**Fix:**
- `clearDashboardSummaryCache('client')` + React Query invalidation after create
- `refetchOnMount: true` in `useDashboardSummary`
- `dashboard-projects-page` clears cache when `?posted=1`
- Backend: skip `filter_quality_project_rows` when `client_id` is set (owner sees all own projects)

---

## Files Changed

| File | Change |
|------|--------|
| `app/(main)/projects/new/page.tsx` | **New** — redirect to `/post-project` |
| `app/(main)/projects/[id]/page.tsx` | Reserved slug guard + redirect |
| `next.config.mjs` | `/projects/new` → `/post-project` redirect |
| `src/domain/constants/routes.ts` | `RESERVED_PROJECT_SLUGS`, `isReservedProjectSlug()` |
| `src/infrastructure/api/client.ts` | `createProject` idempotency + `maxAttempts: 1` |
| `src/presentation/features/project/post-project.tsx` | Submit lock, cache invalidation |
| `backend/app/idempotency.py` | `POST /api/v1/projects` route |
| `backend/app/routers/projects.py` | Skip quality filter for owner `client_id` queries |
| `src/presentation/features/catalog/services-catalog.tsx` | Abort + price filter race fix |
| `src/shared/lib/use-dashboard-summary.ts` | `refetchOnMount: true` |
| `src/presentation/features/dashboard/dashboard-projects-page.tsx` | Cache clear on `?posted=1` |
| `backend/tests/test_idempotency.py` | Projects route test |
| `e2e/p1-marketplace-flow.spec.ts` | **New** regression spec |
| `backend/scripts/verify_p1_project_idempotency.py` | **New** API idempotency script |

---

## Automated Verification

### Playwright (`e2e/p1-marketplace-flow.spec.ts`)

```
✓ BUG-004: /projects/new redirects to post-project
✓ BUG-006: /services loads reliably for guest (3 visits)
```

Run: `npx playwright test e2e/p1-marketplace-flow.spec.ts --workers=1`

Authenticated flow tests (BUG-005, BUG-008) require stable e2e client login; blocked in this session by auth rate limiting (`429` on `/profiles/me`). Code fixes are in place; re-run when backend is not throttled.

### TypeScript

`pnpm type-check` — pass

### Backend unit

`pytest backend/tests/test_idempotency.py` — 3 passed

---

## Screenshots

| Bug | After fix |
|-----|-----------|
| BUG-004 | [p1-bug004-after-post-project.png](./p1-bug004-after-post-project.png) |
| BUG-006 | [p1-bug006-after-services-catalog.png](./p1-bug006-after-services-catalog.png) |

**Before (from E2E report):** `/projects/new` showed project detail loader + `GET /api/v1/projects/new` errors; `/services` showed "Backend javob bermadi" intermittently.

---

## Manual Re-test Checklist

1. Visit `/projects/new` → lands on `/post-project` (not project detail)
2. Create project once → exactly 1 row in `projects` table
3. Open `/services` as guest 5× → no backend error banner
4. After create → `/dashboard/client` and `/dashboard/projects` show new project
5. `/projects` marketplace catalog lists the public project

---

## Notes

- Onboarding CTA already points to `PATHS.postProject` (`/post-project`) — no change needed
- Backend restart required after `idempotency.py` / `projects.py` changes (`pnpm dev:api`)
