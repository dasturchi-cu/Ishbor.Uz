# IshBor.uz — Full E2E Marketplace Simulation Report

**Date:** 2026-06-12  
**Environment:** Local (`http://127.0.0.1:3000` + `http://127.0.0.1:8002`)  
**Tools:** Playwright MCP, Chrome DevTools MCP, Supabase MCP, Filesystem MCP  
**Test accounts created:**
- Client: `e2e-client-20260612@ishbor.test`
- Freelancer: `e2e-freelancer-20260612@ishbor.test`

---

## Executive Summary

| Phase | Status | Coverage |
|-------|--------|----------|
| Phase 1 — Client Journey | **Partial Pass** | Register, login, onboarding, project create, wallet, messages, settings, notifications |
| Phase 2 — Freelancer Journey | **Partial Pass** | Register (DB verified), service create route, projects browse |
| Phase 3 — Client ↔ Freelancer | **Blocked** | Catalog loads after delay; applications API 400 DB error |
| Phase 4 — Admin Journey | **Blocked** | No admin credentials; non-admin correctly denied |
| Phase 5 — Security | **Pass** | Admin routes redirect with `admin_denied=1` |
| Phase 6 — Mobile | **Partial Pass** | No horizontal overflow at tested widths |
| Phase 7 — Browser/Network | **Issues Found** | Intermittent API aborts, catalog empty states |

**Critical blockers:** Applications API returns DB error (400); `/projects/new` route conflict; duplicate project creation on submit; hydration mismatch on projects catalog.

---

## 1. Client Flow Report

### Tested & Passed
| Action | UI | API | DB |
|--------|----|----|-----|
| Register (client role) | ✅ Step 1/2 + form | ✅ `POST supabase/auth/v1/signup` 200 | ✅ `profiles` row, role=`client` |
| Login | ✅ Redirect to dashboard | ✅ `GET /profiles/me` 200 | ✅ Session active |
| Onboarding step 1 | ✅ Profile form | ✅ `PATCH /profiles/me` | ✅ region saved |
| Terms acceptance | ✅ Modal | ✅ terms consent | ✅ `user_terms_consents` |
| Create project (`/post-project`) | ✅ 2-step wizard | ✅ `POST /api/v1/projects` | ✅ 2 rows inserted (duplicate bug) |
| Dashboard pages | ✅ wallet, messages, settings, notifications | ✅ 200 responses | — |
| Admin access denied | ✅ Redirect `?admin_denied=1` | — | — |
| Logout button | ✅ Present in sidebar | — | — |

### Tested & Failed / Not Completed
| Action | Result |
|--------|--------|
| Upload avatar | Not tested (file upload) |
| Edit profile bio | Bio field not found on `/dashboard/profile` |
| Search services (logged out) | "Backend javob bermadi" (Chrome DevTools) |
| Search freelancers | 0 profile links in automated scan (logged in shows categories) |
| Save favorites | Not reached |
| Send/receive messages | UI loads empty state only |
| Hire freelancer / create order | Not tested |
| Leave review | 0 reviews in DB |
| Report user | Not tested |

### Screenshots
- `docs/e2e-simulation-report/phase1-client-dashboard.png`
- `docs/e2e-simulation-report/phase1-project-created.png`
- `docs/e2e-simulation-report/mobile-375-dashboard.png`

---

## 2. Freelancer Flow Report

### Tested & Passed
| Action | UI | API | DB |
|--------|----|----|-----|
| Register (freelancer) | ✅ Role selection + form | ✅ signup 200 | ✅ role=`freelancer` |
| Browse projects page | ✅ "Ochiq loyihalar" | ✅ page loads | — |
| Service create route | ✅ `/dashboard/services/new` "Yangi xizmat" | — | — |

### Tested & Failed / Not Completed
| Action | Result |
|--------|--------|
| Login (fresh context) | Stayed on `/login` after submit |
| Apply to project | E2E project not in catalog; direct URL stuck "Yuklanmoqda..." |
| Create service (submit) | Form not submitted |
| Portfolio upload | Not tested |
| Deliver/complete order | Blocked — no order flow |

---

## 3. Client-Freelancer Interaction Report

**Status: BLOCKED**

1. Client created 2 identical projects (`E2E Test Web Development Project`, budget 5M, status `open`, `is_public=true`)
2. Public `/projects` eventually shows **\"3 ta loyiha topildi\"** (includes duplicates) after client-side hydration — API `GET /api/v1/projects` returns data correctly (verified via curl)
3. Project detail loads for owner view (\"Kelgan arizalar\") but applications API returns **400 DB error**
4. `project_applications` table: **0 rows**
5. Full hire → deliver → review flow could not be executed

---

## 4. Admin Panel Report

**Status: BLOCKED (no admin test credentials)**

- Admin user exists in DB: `dasturchi742@gmail.com` (`is_admin=true`)
- Non-admin client correctly redirected from `/admin`, `/admin/users` → `/dashboard?admin_denied=1`
- Admin dashboard, moderation, audit logs **not tested** (requires admin login)

---

## 5. Security Report

| Test | Result | Severity |
|------|--------|----------|
| `/admin` as regular user | Redirect to dashboard with denial flag | ✅ Protected |
| `/admin/users` as regular user | Redirect with `admin_denied=1` | ✅ Protected |
| Direct API URL `/api/v1/admin/users` in browser | Handled by Next.js (not raw API exposure) | ✅ |
| Supabase leaked password protection | Disabled (advisor warning) | P2 |
| Cross-role data access | Not fully verified (blocked by catalog bug) | — |

---

## 6. Mobile Report

| Viewport | Horizontal Overflow | Notes |
|----------|---------------------|-------|
| 320px | No | Onboarding/terms dialogs |
| 375px | No | Dashboard client usable |
| 390px | No | — |
| 768px | No | — |
| 1024px | No | — |

Screenshot: `mobile-375-dashboard.png`

---

## 7. Performance Report

**Chrome DevTools trace (landing `/`):**
- LCP: **977 ms** (good)
- TTFB: **74 ms**
- Render delay: **903 ms** (main optimization target)
- CLS: **0.06** (acceptable)

**Lighthouse (mobile navigation):**
- Accessibility: **95**
- Best Practices: **96**
- SEO: **100**
- Agentic Browsing: **32** (low — interactive elements labeling)

Reports: `docs/e2e-simulation-report/report.html`, `report.json`

---

## 8. Database Integrity Report

| Table | Observation |
|-------|-------------|
| `profiles` | Both E2E accounts created with correct roles |
| `projects` | 2 duplicate rows for same submission (same client, title, budget) |
| `project_applications` | 0 — apply flow never completed |
| `services` | 15 rows exist; catalog visibility unclear |
| `reviews` | 0 |
| `orders` | 11 existing (not from this test) |
| `audit_logs` | 9 entries in last hour (registration activity logged) |
| `user_terms_consents` | Client accepted terms |

**Supabase Security Advisor:** Leaked password protection disabled.

---

## 9. Bug Report

### P0 — Critical

#### BUG-001: Applications API database error blocks apply flow
- **Reproduction:** Open project detail → `GET /api/v1/applications/project/{id}`
- **Expected:** 200 with applications list
- **Actual:** **400 Bad Request** — `Ma'lumotlar bazasi xatosi`
- **DB:** `project_applications` has 0 rows
- **Screenshot:** `phase3-projects-catalog-empty.png`
- **Root cause (suspected):** Backend query/schema mismatch on applications endpoint
- **Files affected (suspected):** `backend/app/routers/applications.py`
- **Fix:** Fix applications list query; re-test freelancer apply → client accept flow

#### BUG-002: React hydration mismatch delays project catalog render
- **Reproduction:** Load `/projects` page
- **Expected:** Immediate catalog with project cards
- **Actual:** Hydration error in `MarketplaceTrustMetrics`; catalog appears after ~5s client re-fetch
- **API verified:** `GET /api/v1/projects` returns E2E projects (curl 200)
- **Screenshot:** `phase3-projects-catalog-empty.png` (shows 3 projects after hydration)
- **Root cause:** SSR/client HTML mismatch (`<ul>` vs `<a>` in trust metrics)
- **Files affected (suspected):** `MarketplaceTrustMetrics`, `projects-catalog.tsx`

### P1 — High

#### BUG-003: Project view tracking endpoint missing (404)
- **Reproduction:** Visit `/projects/{id}`
- **Expected:** `POST /api/v1/projects/{id}/view` records view
- **Actual:** **404 Not Found**
- **Files affected (suspected):** projects router, `view_events`

#### BUG-004: `/projects/new` route conflicts with project ID "new"
- **Reproduction:** Visit `/projects/new` or onboarding "Loyiha e'lon qilish" (wrong link)
- **Expected:** Create project form OR redirect to `/post-project`
- **Actual:** API calls `GET /api/v1/projects/new` — infinite loading
- **Screenshot:** page stuck on "Yuklanmoqda..."
- **Root cause:** Dynamic route `[id]` captures "new" before static route
- **Files affected (suspected):** `app/(main)/projects/[id]/`, routing config
- **Fix:** Use `/post-project` exclusively or add route guard for reserved slugs

#### BUG-005: Duplicate project creation on single submit
- **Reproduction:** Submit project once on `/post-project` step 2
- **Expected:** 1 DB row
- **Actual:** 2 identical rows (`f99269f4...` and `3a11999b...`)
- **Screenshot:** `phase1-project-created.png`
- **Root cause (suspected):** Missing submit debounce / double-click / React strict mode double effect
- **Files affected (suspected):** post-project form component
- **Fix:** Idempotency key on `POST /projects` or disable button after first click

#### BUG-006: Services catalog fails for logged-out users (intermittent)
- **Reproduction:** Open `/services` in fresh browser (Chrome DevTools)
- **Expected:** Service cards from 15 DB records
- **Actual:** "Backend javob bermadi" + 0 services; API `ERR_ABORTED`
- **Screenshot:** Chrome DevTools snapshot uid=7_61
- **Root cause (suspected):** Race condition / aborted fetch on navigation / CORS preflight pending
- **Files affected (suspected):** services page data fetching, API client abort logic

#### BUG-007: Onboarding "Loyiha e'lon qilish" navigates to landing `/`
- **Reproduction:** Complete onboarding step 2 → click "Loyiha e'lon qilish"
- **Expected:** `/post-project`
- **Actual:** Redirected to `/` (homepage)
- **Fix:** Update onboarding CTA href to `/post-project`

#### BUG-008: Client dashboard shows empty projects after successful create
- **Reproduction:** After `?posted=1`, dashboard client widget shows "Hozircha loyihalar yo'q"
- **Expected:** Show newly created project
- **Actual:** Empty state despite 2 DB rows for client_id
- **Root cause (suspected):** Client dashboard query filter mismatch

### P2 — Medium

#### BUG-009: Registration UI stuck on loading spinner before redirect
- **Reproduction:** Submit registration form
- **Expected:** Immediate redirect to onboarding
- **Actual:** 8+ seconds on register page with disabled spinner
- **Fix:** Improve post-signup navigation feedback

#### BUG-010: Terms modal blocks actions without clear persistence
- **Reproduction:** Visit dashboard pages after registration
- **Expected:** Terms accepted once during registration
- **Actual:** "Yangilangan shartlar" modal appears again

#### BUG-011: Freelancer login fails in isolated browser context
- **Reproduction:** New Playwright context → login with freelancer credentials
- **Expected:** Dashboard redirect
- **Actual:** Remains on `/login`
- **Note:** May require email confirmation — verify Supabase auth settings

#### BUG-012: Password fields not in `<form>` element
- **Console:** DOM warning on register page
- **Fix:** Wrap registration fields in semantic `<form>`

### P3 — Low

#### BUG-013: Login button selector ambiguity
- **Issue:** `getByRole('button', { name: /Kirish/i })` matches Google login too
- **Fix:** Use exact match or `type=submit` selector in tests and a11y

#### BUG-014: Analytics funnel requests aborted
- **Network:** `POST /platform/analytics/funnel` → `ERR_ABORTED` on navigation
- **Impact:** Analytics data loss only

#### BUG-015: Lighthouse Agentic Browsing score 32
- **Impact:** AI/browser automation may struggle with unlabeled controls

---

## Test Accounts (for follow-up)

```
Client:     e2e-client-20260612@ishbor.test / TestPass123!
Freelancer: e2e-freelancer-20260612@ishbor.test / TestPass123!
Project IDs: 3a11999b-72d4-4331-95d6-8492c99ffe59, f99269f4-b55b-49ba-be30-abae3408ad9e
Client ID:  cda09847-6444-4f7e-87a3-b58afbb60ebe
```

---

## Recommended Next Steps

1. **Fix P0:** Project catalog + detail loading (unblocks Phase 3)
2. **Fix P1:** Route conflict `/projects/new`, duplicate submit idempotency
3. **Re-run** client-freelancer apply → accept → message → deliver → review flow
4. **Admin test** with `dasturchi742@gmail.com` credentials
5. **Enable** Supabase leaked password protection
6. **Add** E2E Playwright spec covering `/post-project` happy path

---

*Generated by autonomous E2E simulation — Playwright + Chrome DevTools + Supabase MCP*
