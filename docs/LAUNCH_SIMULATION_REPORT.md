# Launch Simulation Report

**Date:** 2026-06-12  
**Environment:** Frontend `:3000`, Backend `:8002` (local dev)  
**Personas:** Guest/Client · Freelancer · Admin (API gates)

---

## Executive summary

| Layer | Result |
|-------|--------|
| Playwright E2E | **87 passed**, 3 skipped (90 total) |
| Backend pytest | **129 passed** |
| Launch simulation spec | **13 passed**, 2 skipped (auth credentials) |

**Verdict:** Core marketplace flows are **launch-ready for sandbox/demo**. Live Click/Payme, admin UI with real credentials, and catalog content quality remain pre-launch items.

---

## Persona flows exercised

### Guest / Client

| Flow | Status | Notes |
|------|--------|-------|
| Landing → services → pricing | ✅ | Public pages load, no 5xx |
| Service detail → secure checkout modal | ✅ | Guest stays on page; dialog opens |
| Post-project (public) | ✅ | No login redirect |
| Protected dashboard redirect | ✅ | `/dashboard/orders` → `/login` |
| Search empty state + discovery hints | ✅ | Fixed loading blank gap in catalog |
| Buyer protection / trust signals | ✅ | Escrow strip visible |

### Freelancer

| Flow | Status | Notes |
|------|--------|-------|
| Freelancers catalog | ✅ | `#freelancers-catalog` loads |
| Sell CTA on services hero | ✅ | Register link, not “create service” for guests |
| Projects catalog (bidding) | ✅ | Page loads |
| Create service API | ✅ | 401 without token |

### Authenticated client (`diag-timeout-test@ishbor.uz`)

| Flow | Status | Notes |
|------|--------|-------|
| Login → dashboard | ⏭️ skip | Credentials unavailable in this run |
| Wallet / messages pages | ⏭️ skip | Depends on login |
| Payments config | ✅ | `checkout_available` boolean returned |

### Admin

| Flow | Status | Notes |
|------|--------|-------|
| `/admin/moderation` redirect | ✅ | Unauthenticated → login |
| Admin API auth gates | ✅ | verifications, disputes, analytics → 401 |
| Full admin UI workflow | ⏭️ not run | No `is_admin` E2E account configured |

---

## Fixes applied during simulation

### P0 — E2E stability under parallel load

- **API tests** (`marketplace-flow`, `milestones`, launch-simulation API steps) now hit backend **directly** (`127.0.0.1:8002`) via `e2e/helpers.ts` → avoids Next.js proxy contention/timeouts.
- **Journey tests** use dynamic `getFirstServiceId()` instead of hardcoded missing UUID.
- **`gotoServiceDetail()`** waits for `/api/v1/services/{id}` before asserting checkout CTA.

### P1 — Services catalog loading UX

- **Blank state during search:** Initial load with no cached services now shows skeleton immediately (`services-catalog.tsx`). Previously `useDelayedShow` left an empty gap for up to 300ms (worse under slow API).

### P1 — Search discovery E2E

- Tests wait for `/api/v1/services` response before asserting `.search-discovery-hints`.

### New artifact

- `e2e/launch-simulation.spec.ts` — serial persona suite for regression.

---

## Remaining blockers & deferred items

| Priority | Item | Impact | Action |
|----------|------|--------|--------|
| **P1** | Catalog content quality | Only junk service (`sddsads`) in DB | Seed 5–10 approved demo services before marketing launch |
| **P1** | Live Click/Payme | Production payments | Per `plan-status.md` — sandbox works |
| **P2** | Admin E2E account | Cannot test moderation UI end-to-end | Set `profiles.is_admin = true` for a test user |
| **P2** | Backend restart | `/notifications/channels` missing `redis` field on running instance | `pnpm dev:stop:api` → `pnpm dev:api` after notification changes |
| **P2** | Authenticated client skips | `diag-timeout-test@ishbor.uz` login failed this session | Verify Supabase test user or rotate password |
| **P3** | WebRTC / video calls | Not in E2E scope | Manual QA on staging |

---

## Test matrix (full E2E)

```
smoke ...................... 11/11
auth ....................... 5/5
catalog .................... 6/6
api proxy .................. 2/2
admin moderation ........... 2/2
journey audit fixes ........ 5/6 (1 skipped — login)
search discovery ........... 3/3
marketplace escrow API ..... 2/2
milestones API ............. 1/1
wallet topup API ........... 2/2
verification API ........... 1/1
chat attachment API ........ 1/1
trust signals .............. 3/3
ui actions ................. 27/27
launch simulation .......... 13/15 (2 skipped — login)
```

---

## How to re-run

```bash
pnpm dev:status
# Frontend :3000 + Backend :8002 must be running

pnpm exec playwright test                    # full suite
pnpm exec playwright test e2e/launch-simulation.spec.ts

cd backend && python -m pytest -q
```

Set `PW_SKIP_WEBSERVER=1` when dev servers are already up.

---

## Recommendation

**Soft launch** (sandbox payments, demo catalog seeding) is unblocked. **Public marketing launch** should wait for: real payment providers, quality catalog content, and verified admin moderation path with a dedicated admin test account.
