# Troubleshooting

Common development and staging issues for IshBor.uz — ports, migrations, authentication, and API connectivity.

---

## Quick diagnostics

```powershell
pnpm dev:status        # Which ports are in use (3000, 8002)
pnpm dev:check         # Environment variable sanity check
pnpm dev:check:strict  # Stricter validation
pnpm db:verify         # Migration/schema consistency
pnpm health            # API health probe (when backend running)
```

---

## Dev servers

### Port 3000 already in use (frontend)

**Symptom:** `pnpm dev` fails with `EADDRINUSE` or Next.js cannot bind to port 3000.

**Cause:** Another Next.js instance, Cursor, or process is using port 3000.

**Fix:**

```powershell
pnpm dev:status          # Identify listener PID
pnpm dev:stop            # Graceful stop via project scripts
pnpm dev:status          # Confirm port is free
pnpm dev                 # Start frontend only
```

Do **not** run `taskkill /F /IM node.exe` — it kills Cursor and other Node processes.

### Port 8002 already in use (backend)

**Symptom:** `pnpm dev:api` fails; API requests return connection refused or hit wrong process.

**Fix:**

```powershell
pnpm dev:status
pnpm dev:stop
pnpm dev:api
```

Verify: `curl http://127.0.0.1:8002/api/v1/health`

### Duplicate dev servers

**Symptom:** Stale code, random 503s, HMR not updating.

**Cause:** Multiple `pnpm dev` or `pnpm dev:api` instances started manually.

**Fix:** Always use `pnpm dev:stop` before starting. Prefer `pnpm dev:start` for a clean bootstrap (port cleanup + migrations + both servers).

### Recommended startup

```powershell
pnpm dev:start     # Full stack: migrations + frontend + backend
# OR
pnpm dev:all       # Frontend (HMR) + backend (--reload), no migration prep
```

Code changes auto-reload — manual restart is usually not needed. See `AGENTS.md` § Dev serverlar.

---

## Environment variables

### Missing Supabase keys

**Symptom:** Auth fails, "Invalid API key", blank session.

**Check:**

| File | Variables |
|------|-----------|
| `.env.local` (frontend) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL` |
| `backend/.env` | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET` |

`NEXT_PUBLIC_API_URL` must point to `http://127.0.0.1:8002` locally.

Run `pnpm dev:check` to validate.

### JWT secret mismatch

**Symptom:** API returns 401 on all authenticated requests; token verify fails in backend logs.

**Cause:** `SUPABASE_JWT_SECRET` in `backend/.env` does not match Supabase project JWT secret.

**Fix:** Copy JWT secret from Supabase Dashboard → Project Settings → API → JWT Secret.

### CORS errors in browser

**Symptom:** `Access-Control-Allow-Origin` error when frontend calls API.

**Fix:** Ensure backend `CORS_ORIGINS` includes `http://localhost:3000` and your staging URL. Restart backend after changing `.env`.

---

## Database & migrations

### Pending migrations

**Symptom:** 500 errors on new features, missing columns, `relation does not exist`.

**Fix:**

```powershell
pnpm db:push
pnpm db:verify
```

Recent migrations may include enterprise security, FAQ, and `includes` schema changes. Check [plan-status.md](../plan-status.md) for the latest required migrations.

### `supabase db push` fails

| Error | Fix |
|-------|-----|
| Not linked | `supabase link --project-ref <your-ref>` |
| Auth failed | `supabase login` |
| Migration conflict | Review `supabase/migrations/` ordering; do not edit applied migrations |
| RLS policy error | Check SQL syntax in latest migration file |

### Local vs remote database

IshBor.uz uses a **linked remote Supabase project** for development (not local Docker Postgres by default). Ensure you are pushing to the correct project before `db:push`.

---

## Authentication issues

### Auth race condition (blank page / flash redirect)

**Symptom:** After login or page refresh, dashboard shows empty state, redirects to login briefly, or API calls return 401 then succeed on retry.

**Cause:** Protected page fetches data before Supabase session is hydrated.

**Fix (for developers):**

- Use `useAuthReady()` before rendering auth-dependent UI
- Use `useProtectedLoader()` for data fetching on protected pages
- Do not call `api.*` directly in `useEffect` without waiting for `ready === true`

Example pattern:

```typescript
const { ready, authed, userId } = useAuthReady()

useEffect(() => {
  if (!ready || !authed) return
  // safe to fetch
}, [ready, authed])
```

Most dashboard pages have been migrated (~99%). If you see a new page with this bug, apply the same hooks.

### 401 after idle period

**Symptom:** User logged out unexpectedly; API returns 401.

**Cause:** Supabase refresh token expired or `apiFetch` retry exhausted.

**Fix:** Log in again. `apiFetch` includes GET retry + token refresh — if persistent, check Supabase session settings.

> `SESSION_IDLE_MINUTES` is configured but not yet enforced server-side. See [KNOWN_ISSUES.md](./KNOWN_ISSUES.md).

### Email verification banner persists

**Symptom:** Banner shows "Email not verified" after clicking verification link.

**Check:**
- Supabase Auth → user `email_confirmed_at` is set
- Correct redirect URL in Supabase email templates
- `REQUIRE_EMAIL_VERIFIED` is `false` by default — banner is informational only

### Admin access denied

**Symptom:** `/admin` redirects or shows forbidden.

**Fix:** Grant admin in Supabase SQL editor:

```sql
UPDATE profiles SET is_admin = true WHERE email = 'your@email.com';
```

### Suspended / banned user

**Symptom:** `SuspendedBanner` visible; all API calls return 403.

**Fix:** Admin must unsuspend via admin panel or direct DB update (dev only).

---

## API connectivity

### Frontend cannot reach backend

**Symptom:** Network errors, `Failed to fetch`, timeout on dashboard.

**Checklist:**

1. Backend running: `pnpm dev:status` shows port 8002
2. Health check: `http://127.0.0.1:8002/api/v1/health`
3. `NEXT_PUBLIC_API_URL=http://127.0.0.1:8002` in `.env.local`
4. No VPN/firewall blocking localhost

### 503 Service Unavailable from API

**Symptom:** Intermittent 503 on list/detail endpoints.

**Cause:** Supabase query timeout or un-migrated `run_query` wrapper issue.

**Fix:**
- Run `pnpm db:push`
- Check backend logs for Supabase error details
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set (backend uses service role for most queries)

### Placeholder CI vs real API

**Symptom:** Tests pass in CI but fail locally.

**Cause:** CI uses placeholder Supabase credentials; local requires real linked project.

---

## Payments & wallet (sandbox)

### Wallet top-up does not update balance

**Symptom:** Top-up API returns success; UI balance unchanged.

**Fix:**
- Wait for polling (`wallet-topup-poll`) — up to 30 seconds
- Check order/payment status in Network tab
- Verify escrow migration applied

### Withdrawal blocked

**Symptom:** Error message about unverified bank account.

**Expected behavior:** Bank account must be admin-verified before withdrawal. Complete bank verification in profile settings and wait for admin approval.

### Live Click/Payme not working

**Expected:** Live payments are **not enabled** without merchant credentials. Use sandbox wallet flows. See [KNOWN_ISSUES.md](./KNOWN_ISSUES.md).

---

## Build & test failures

### `pnpm build` fails

| Error | Fix |
|-------|-----|
| Type error | `pnpm type-check` for details |
| Missing env at build | `NEXT_PUBLIC_*` vars required; CI uses placeholders |
| Module not found | Check `@/` import paths match `src/` structure |

### `pnpm test:backend` — no venv

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
cd ..
pnpm test:backend
```

### Playwright E2E timeout

```powershell
pnpm dev:status                    # Ensure :3000 listening
$env:PW_SKIP_WEBSERVER = "1"       # Reuse running dev server
pnpm test:e2e
```

For full-stack E2E, also start backend on :8002.

### Turbopack cache corruption

**Symptom:** Strange compile errors, stale modules.

```powershell
pnpm dev:clean-cache
pnpm dev
```

---

## Storage & uploads

### Avatar / chat attachment upload fails

**Check:**
- `pnpm check:storage` — bucket policies and CORS
- Supabase Storage bucket exists (`avatars`, `chat-attachments`)
- File size within limits
- User is authenticated

Chat attachments use a **private bucket** with signed URLs — direct public URL will not work.

---

## Windows-specific notes

- Use `;` instead of `&&` in PowerShell command chains
- Backend venv path: `backend\.venv\Scripts\python`
- Line endings: project uses LF; Git `core.autocrlf` may affect shell scripts

---

## Getting help

| Issue type | Contact |
|------------|---------|
| Dev environment | GitHub Discussions / team channel |
| Bug | [BUG_REPORTING.md](./BUG_REPORTING.md) |
| Security | hello@ishbor.uz `[SECURITY]` |
| User support | hello@ishbor.uz |

---

## Related documents

- [TESTING.md](./TESTING.md) — Test commands and CI
- [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) — Accepted platform limitations
- [AUTHENTICATION.md](./AUTHENTICATION.md) — Auth architecture
- [plan-status.md](../plan-status.md) — Current project status
