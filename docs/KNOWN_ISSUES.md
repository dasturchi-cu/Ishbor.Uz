# Known Issues

Documented limitations and accepted technical debt for IshBor.uz as of **June 2026**. Sourced from [plan-status.md](../plan-status.md) and [actionable-backlog.md](./actionable-backlog.md).

> **Note:** This list tracks known gaps, not every open backlog item. For the full task tracker see [actionable-backlog.md](./actionable-backlog.md) (100 tasks, Click/Payme excluded).

---

## Summary

| Category | Status | Impact |
|----------|--------|--------|
| Live payments (Click/Payme) | **Deferred** (code ready) | Sandbox wallet works; merchant credentials = final launch step |
| Production deployment | Not deployed | No public production environment |
| Email verification enforcement | Config only | Unverified emails can use platform |
| Session idle timeout | Enforced (client + API) | `SESSION_IDLE_MINUTES` / `NEXT_PUBLIC_SESSION_IDLE_MINUTES` |
| User impersonation (admin) | Not implemented | Support must use DB for user debugging |
| Optional auth on some public endpoints | Partial | Minor information disclosure risk |
| Enterprise security migrations | May be pending | Run `pnpm db:push` if not applied |

**Overall MVP completion:** ~75–80% (sandbox payments working; live payments and deploy pending).

---

## P0 — Platform limitations

### 1. Live Click/Payme payments not enabled

| Field | Detail |
|-------|--------|
| **Status** | ⬜ Blocked on merchant credentials |
| **Impact** | Users cannot complete real-money card payments via Click or Payme |
| **Workaround** | Sandbox wallet top-up (`POST /payments/wallet/topup`) and `pay-wallet` for orders |
| **What works** | Escrow hold, release, refund simulation; wallet ledger; order payment from wallet balance |
| **Blocked UI** | `payment_click_soon`, `payment_payme_soon`, `top_up_coming_soon`, live checkout provider |
| **Resolution** | Separate sprint when Click/Payme merchant accounts and production webhooks are configured |
| **References** | `plan-status.md`, `actionable-backlog.md` § Click/Payme, `supabase` feature flag `live_payments` |

### 2. Production deployment pending

| Field | Detail |
|-------|--------|
| **Status** | ⬜ Not deployed |
| **Impact** | No production URL serving live traffic at scale |
| **Target stack** | Vercel (frontend) + Supabase (DB/auth) + Railway or container host (backend API) |
| **Prerequisites** | Live payments decision, migration push, `pnpm preflight`, security review |
| **Resolution** | Deploy sprint after payment provider decision |

### 3. Email verification (opt-in enforcement)

| Field | Detail |
|-------|--------|
| **Status** | ✅ Ready — disabled by default (`REQUIRE_EMAIL_VERIFIED=false`) |
| **Backend** | Enforced in `deps.py` when flag is `true` |
| **Frontend** | `VerifyEmailBanner`, checkout blocked when flag enabled via `useEmailVerificationGate` |
| **Resolution for production** | Set `REQUIRE_EMAIL_VERIFIED=true` after email deliverability is validated |
| **References** | `GET /api/v1/security/config`, `AUTHENTICATION.md` |

---

## P1 — Security & admin gaps

### 4. Session idle timeout

| Field | Detail |
|-------|--------|
| **Status** | ✅ Enforced |
| **Client** | `useSessionIdleTimeout` in `AppProvider` + dashboard layout |
| **Server** | `enforce_and_touch_session_idle` in `require_user_auth` |
| **Config** | `SESSION_IDLE_MINUTES`, `NEXT_PUBLIC_SESSION_IDLE_MINUTES` |

### 5. User impersonation (admin support) — deferred

| Field | Detail |
|-------|--------|
| **Status** | ⏸️ Deferred (new feature; not launch-blocking) |
| **Backlog** | actionable-backlog #26 |
| **Workaround** | Admin user detail + audit logs |
| **Resolution** | Separate sprint: audited impersonation with time-limited token |

### 6. `get_optional_user_id` coverage

| Field | Detail |
|-------|--------|
| **Status** | ✅ Complete on public catalog endpoints |
| **Endpoints** | services, profiles, companies, projects, vacancies, platform analytics |
| **Guard** | `OptionalUserIdLight` delegates to full ban/suspend guard |

### 7. Enterprise security migrations

| Field | Detail |
|-------|--------|
| **Status** | ✅ Applied on linked Supabase (through `20240631180000`) |
| **Verify** | `pnpm db:verify` + `check_launch_readiness()` |
| **New environments** | Run `pnpm db:push` before deploy |

---

## P2 — Feature limitations

### 8. Backup restore is record-only

| Field | Detail |
|-------|--------|
| **Status** | ✅ UI exists; restore not automated |
| **Impact** | Admin can record backup checkpoints but cannot one-click restore from UI |
| **Workaround** | Supabase point-in-time recovery (paid plan) or manual SQL restore |
| **Backlog** | P1 #30 — `admin-backups-page.tsx` |

### 9. Pro pricing / live billing not available

| Field | Detail |
|-------|--------|
| **Status** | ⬜ Depends on live payments |
| **Impact** | Subscription or pro tier billing not active |
| **Resolution** | After Click/Payme live integration |

### 10. Payment partner logos / trust badges deferred

| Field | Detail |
|-------|--------|
| **Status** | Placeholder i18n keys (`trust_partners_soon`, `footer_payments_soon`) |
| **Impact** | Landing/footer may show "coming soon" for payment partners |
| **Resolution** | Enable when live payment contracts signed |

---

## Resolved recently (for context)

These were known issues now fixed — do not re-report without verifying regression:

| Issue | Resolution |
|-------|------------|
| Auth race on dashboard/API pages | `useAuthReady` / `useProtectedLoader` (~99% coverage) |
| Chat duplicate threads | Unified inbox API + conversation merge |
| Verification reject not clearing badge | Admin reject sets `is_verified=false` |
| `run_query` 503 on critical routers | ~95% router migration complete |
| Withdrawal without bank verify | Clear error message + admin bank verify UI |
| Order dispute not linked to admin | Dispute table + admin overview |

---

## Workarounds reference

| Need | Workaround |
|------|------------|
| Test full order flow | Sandbox wallet top-up → pay-wallet → deliver → complete |
| Test admin features | SQL: `UPDATE profiles SET is_admin = true WHERE email = '...'` |
| Test payments UI | Wallet dashboard; ignore Click/Payme buttons (disabled) |
| Debug user issue | Admin user detail, audit log, order ID lookup |
| Apply schema fixes | `pnpm db:push` then `pnpm db:verify` |

---

## Reporting new issues

If you encounter behavior not listed here:

1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for dev environment fixes
2. File a bug using [BUG_REPORTING.md](./BUG_REPORTING.md)
3. Security issues → hello@ishbor.uz `[SECURITY]` (not public GitHub)

---

## Review cadence

This document should be updated:

- After each release sprint
- When a known issue is resolved (move to "Resolved" section)
- When new blockers are discovered during QA

**Last reviewed:** 2026-06-12  
**Next review:** Before production deploy

---

## Related documents

- [plan-status.md](../plan-status.md) — Project status overview
- [actionable-backlog.md](./actionable-backlog.md) — Full task backlog
- [QA_PROCESS.md](./QA_PROCESS.md) — Release gates
- [CHANGELOG.md](../CHANGELOG.md) — Version history
