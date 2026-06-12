# Bug Reporting

How to report bugs for IshBor.uz — for developers, QA testers, and end users.

---

## Before you report

1. **Search existing issues** — Check GitHub Issues and [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) to avoid duplicates.
2. **Reproduce once** — Confirm the bug is repeatable with clear steps.
3. **Try a fresh session** — Log out, clear cache, or use an incognito window to rule out stale auth.
4. **Note your environment** — Browser, OS, language, account role (employer/freelancer/admin).

---

## Where to report

| Reporter | Channel | Use when |
|----------|---------|----------|
| **End user** | hello@ishbor.uz or in-app help | Account, payment, order issues |
| **Developer / contributor** | GitHub Issues | Code bugs, reproducible defects |
| **Security vulnerability** | hello@ishbor.uz `[SECURITY]` | **Never** public GitHub issue |

See [SECURITY.md](../SECURITY.md) for vulnerability disclosure.

---

## What makes a good bug report

A complete report saves hours of back-and-forth:

| Field | Why it matters |
|-------|----------------|
| Clear title | One-line summary of broken behavior |
| Steps to reproduce | Anyone can follow and see the bug |
| Expected vs actual | Defines "correct" behavior |
| Environment | Browser, OS, locale, role |
| Screenshots / video | Visual proof for UI bugs |
| Console / network logs | Root cause for dev investigation |
| Severity estimate | Helps triage priority |

---

## Bug report template

Copy and fill in the template below.

```markdown
## Bug report

### Summary
<!-- One sentence: what is broken? -->
e.g., "Wallet top-up succeeds but balance does not update in dashboard"

### Environment
- **URL:** https://ishbor.uz/dashboard/wallet (or localhost:3000)
- **Date/time (UTC+5):** YYYY-MM-DD HH:MM
- **Browser:** Chrome 125 / Safari 17 / Firefox 128
- **OS:** Windows 11 / macOS 14 / Android 14
- **Language:** uz / ru / en
- **Account role:** employer / freelancer / admin
- **User ID or email:** (optional — helps support lookup)

### Steps to reproduce
1. Log in as freelancer
2. Navigate to Dashboard → Wallet
3. Click "Top up" and enter 100 000 soʻm
4. Complete sandbox payment
5. Return to wallet page

### Expected behavior
Wallet balance increases by 100 000 soʻm within 5 seconds.

### Actual behavior
Balance remains 0 soʻm. No error message shown.

### Screenshots / recordings
<!-- Attach images or Loom link -->

### Console errors
```
Paste browser DevTools Console output (F12 → Console)
```

### Network errors
```
Paste failed request from DevTools → Network
- Method + URL
- Status code
- Response body (redact tokens)
```

### Severity (your estimate)
- [ ] P0 — Blocker (data loss, payment failure, security, site down)
- [ ] P1 — Critical (core feature broken, no workaround)
- [ ] P2 — Major (feature degraded, workaround exists)
- [ ] P3 — Minor (cosmetic, rare edge case)

### Additional context
<!-- Related order ID, service ID, recent changes, workaround tried -->
```

---

## Severity definitions

| Level | Examples | Response target |
|-------|----------|-----------------|
| **P0** | Escrow funds stuck, auth bypass, admin data leak, production 500 on login | Same business day |
| **P1** | Cannot place order, chat messages not sending, withdrawal fails silently | 1–3 business days |
| **P2** | Filter broken, wrong i18n string, slow page load | Next sprint |
| **P3** | Typo, minor alignment issue, rare UI glitch | Backlog |

---

## Common bug categories

### Authentication

Include:
- Whether email is verified
- Whether 2FA is enabled
- Whether issue occurs on first load after login (auth race)
- JWT expiry time if known

### Payments & escrow

Include:
- Order ID
- Payment method (wallet sandbox / Click / Payme)
- Amount in soʻm
- Escrow status from order detail
- Whether issue is sandbox or live

> Live Click/Payme payments are not yet enabled. See [KNOWN_ISSUES.md](./KNOWN_ISSUES.md).

### Chat & notifications

Include:
- Conversation ID or order ID linked to thread
- Whether duplicate threads appear in inbox
- Realtime vs REST-only reproduction

### Admin panel

Include:
- Admin action attempted (verify, suspend, dispute resolve)
- Target user/service ID
- API response from Network tab

---

## Information to redact

Do **not** include in public bug reports:

- Passwords or OTP codes
- Full JWT tokens (truncate to first/last 8 chars)
- Bank account numbers, passport scans
- `SUPABASE_SERVICE_ROLE_KEY` or any server secret
- Other users' personal data

For sensitive financial bugs, email hello@ishbor.uz directly with `[BUG]` in the subject.

---

## Developer workflow

### Triage

1. Reproduce locally (`pnpm dev:start`)
2. Check logs: browser console, backend terminal, Sentry
3. Assign severity (P0–P3)
4. Link to related backlog item in [actionable-backlog.md](./actionable-backlog.md) if known

### Fix verification

1. Add or update automated test if applicable
2. Run `pnpm verify`
3. QA reproduces fix on staging
4. Update [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) if closing a known limitation

### GitHub issue labels (suggested)

| Label | Meaning |
|-------|---------|
| `bug` | Confirmed defect |
| `p0` / `p1` / `p2` / `p3` | Priority |
| `auth` | Authentication/session |
| `payments` | Wallet, escrow, Click/Payme |
| `chat` | Messaging, notifications |
| `admin` | Admin panel |
| `i18n` | Translation/locale |
| `regression` | Previously working feature broke |

---

## User-facing support

End users who cannot file GitHub issues should contact:

| Channel | Details |
|---------|---------|
| Email | hello@ishbor.uz |
| Telegram | @IshBorUz |
| In-app | Help page (`/help`) |

Support will request:
- Registered email address
- Brief description of the issue
- Order or transaction reference (if payment-related)
- Screenshot (optional)

---

## Related documents

- [QA_PROCESS.md](./QA_PROCESS.md) — QA checklists and release gates
- [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) — Known limitations
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — Common dev fixes
- [SECURITY.md](../SECURITY.md) — Security vulnerability reporting
