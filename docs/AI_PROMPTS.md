# AI Prompts

Example prompts for common IshBor.uz development tasks. Copy, adapt, and paste into Cursor Agent.

---

## How to use

1. Include **scope** (what to change, what to leave alone)
2. Reference **files or routes** when known
3. State **constraints** (minimal diff, no dev server, no commit)
4. Invoke **skills** by name when you want a specific audit

---

## Feature development

### New dashboard page

```
Add a new dashboard page at /dashboard/analytics for freelancers.

Requirements:
- Follow Clean Architecture: feature in src/presentation/features/analytics/
- Add route to PATHS in src/domain/constants/routes.ts
- All UI text via i18n (uz, ru, en)
- Include loading skeleton and empty state
- Use design tokens from design/figma-tokens.json
- Minimal diff — do not refactor unrelated files
- Do not start dev servers or create commits
```

### Service catalog filter

```
Add a price range filter to the services catalog.

- Read skills/ishbor-mvp/SKILL.md and docs/UI_UX_GUIDELINES.md first
- Filter state in URL query params for SEO shareability
- Use api.listServices — no direct supabase.from()
- Mobile: filters in a sheet/drawer
- i18n for all labels
```

### Order status update

```
Implement client "approve delivery" action on order detail page.

- Backend: use existing FastAPI order endpoints
- Follow order flow in mvp.md: delivered → completed
- Trigger escrow release via API (not direct RPC from frontend)
- Show success toast with i18n key
- Handle error states with retry
```

---

## Backend & API

### New FastAPI endpoint

```
Create GET /api/v1/profiles/{id}/stats endpoint.

- Read skills/ishbor-backend/SKILL.md
- Add Pydantic schema in backend/app/schemas.py
- Use Supabase service role from backend only
- Document in docs/API_REFERENCE.md
- Add TypeScript types in src/infrastructure/api/types.ts
- No secrets in code
```

### Click webhook handler

```
Review and harden Click payment webhook signature verification.

- Read docs/WEBHOOKS.md and docs/PAYMENTS.md
- Verify HMAC per Click SHOP-API spec
- Idempotent complete handler (no double escrow hold)
- Log errors without exposing secrets
- Run ishbor-security-review mindset on findings
```

---

## i18n

### Add translation keys

```
Add i18n keys for wallet withdrawal flow.

- Read skills/ishbor-i18n/SKILL.md
- Keys: wallet_withdraw_title, wallet_withdraw_amount, wallet_withdraw_submit, wallet_withdraw_success
- Add uz, ru, en in src/infrastructure/i18n/
- Replace any hardcoded strings in wallet feature
- Run npx tsc --noEmit
```

---

## UI / design

### Fix auth form select

```
Register page region dropdown is unreadable on purple background.

- Apply .select-auth class per docs/UI_UX_GUIDELINES.md
- Do not change non-auth selects
- Verify on mobile viewport
```

### Landing section redesign

```
Redesign the landing hero section.

- Read taste-skill (~/.cursor/skills/taste-skill/SKILL.md)
- Use Plus Jakarta Sans for headline, Inter for body
- Primary #2563EB, no template-slop gradients
- Keep existing i18n keys or add new ones in all 3 locales
- Do not add a second footer (landing uses global layout footer)
```

---

## Reviews & audits

### UI regression check

```
Run ishbor-ui-review on the services catalog page.

- Check i18n, responsive, loading/empty states, token usage
- Report issues as P0–P3
- Do not start dev servers
- Suggest fixes but only implement if I confirm
```

### Pre-launch security

```
Run ishbor-security-review for payment and auth flows.

Focus: RLS, webhook secrets, escrow RPC access, file upload buckets.
Output: prioritized findings with file references.
No code changes unless P0.
```

### SEO audit

```
Run ishbor-growth-review focused on SEO.

Check: sitemap.ts, metadata per route, region pages, blog slugs.
Compare to docs/SEO_STRATEGY.md.
Suggest improvements only — no implementation.
```

---

## Debugging

### Payment stuck in processing

```
Order payment intent stuck in "processing" status.

- Read docs/PAYMENTS.md
- Trace checkout flow: frontend payment-checkout.ts → API → webhook
- Check pnpm dev:status — do NOT restart servers unless I ask
- Diagnose root cause and propose minimal fix
```

### TypeScript errors after i18n change

```
npx tsc --noEmit fails after adding new translation keys.

- Ensure TranslationKey union includes new keys
- No duplicate keys across locale objects
- Fix with minimal diff
```

---

## Git & PR (when requested)

### Create commit

```
Create a git commit for the staged changes.

Follow project commit message style from recent git log.
Do not push unless I ask.
```

### Create pull request

```
Create a PR for this branch against main.

Include summary, test plan, and link to related docs.
Use gh pr create.
```

---

## Anti-patterns in prompts

| Weak prompt | Better prompt |
|-------------|---------------|
| "Fix the app" | "Fix 404 on /dashboard/wallet — check routes.ts redirect" |
| "Make it look better" | "Redesign hero per taste-skill, keep i18n, primary #2563EB" |
| "Add payments" | "Enable Payme webhook per WEBHOOKS.md, sandbox first" |
| "Run the server" | Only ask when you need live debugging |

---

## Related documents

| Document | Topic |
|----------|-------|
| [AI_WORKFLOWS.md](./AI_WORKFLOWS.md) | Bootstrap, skills |
| [AI_AGENT_RULES.md](./AI_AGENT_RULES.md) | Hard rules |
| [AI_SAFETY.md](./AI_SAFETY.md) | Safety boundaries |
