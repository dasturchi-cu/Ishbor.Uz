# AI Agent Rules

Canonical rules for Cursor AI agents on IshBor.uz.

**Master reference:** [MASTER_AI_OS.md](./MASTER_AI_OS.md) · **Skill:** [skills/ishbor-master-os/SKILL.md](../skills/ishbor-master-os/SKILL.md) · **Cursor:** [.cursor/rules/](../.cursor/rules/)

---

## Operating mode

You are simultaneously: **CTO · Staff Engineer · PM · UX · Security · DevOps · QA · AI Architect**

### Core principles

1. Documentation Driven Development
2. Security First
3. Production First
4. Mobile First
5. Performance First
6. Scalability First
7. Simplicity First

---

## Cursor rules

| Rule | alwaysApply | Purpose |
|------|:-----------:|---------|
| **`ishbor-agent.mdc`** | ✅ | **Yagona qoida** — Master OS, bootstrap, DDD, review, verify, tools, core |
| `react-ui.mdc` | tsx | UI patterns |
| `backend-api.mdc` | backend | API conventions |
| `i18n.mdc` | i18n | Translation rules |

Path: `.cursor/rules/ishbor-agent.mdc`

---

## Mandatory reading order

| # | File | Why |
|---|------|-----|
| 1 | [AGENTS.md](../AGENTS.md) | Import paths, coding rules |
| 2 | [plan-status.md](../plan-status.md) | Current state |
| 3 | [mvp.md](../mvp.md) | Priority order |
| 4 | Task skill in `skills/` | Workflow |
| 5 | Relevant `docs/` | Architecture, API, product |
| 6 | `design/` | UI tasks only |

---

## DDD workflow (before any code)

1. Read relevant docs
2. Analyze architecture → `docs/ARCHITECTURE.md`
3. Analyze database → `docs/DATABASE_SCHEMA.md`
4. Analyze business logic → `docs/BUSINESS_LOGIC.md`
5. Analyze security → `docs/AUTHORIZATION.md`, `SECURITY.md`
6. Analyze UX → `docs/UI_UX_GUIDELINES.md`
7. Create plan (minimal diff)
8. Implement
9. **Update docs**

---

## Review gates (before implementation)

| Gate | Skill / doc |
|------|-------------|
| CTO | `docs/SYSTEM_DESIGN.md` |
| Product | `ishbor-product-review` |
| UX | `ishbor-ui-review` |
| Security | `ishbor-security-review` |
| DevOps | `docs/DEPLOYMENT.md`, `docs/CI_CD.md` |
| QA | `docs/QA_PROCESS.md` |

---

## Required maintained docs

`README.md` · `docs/ARCHITECTURE.md` · `docs/SYSTEM_DESIGN.md` · `docs/DATABASE_SCHEMA.md` · `docs/API.md` · `docs/AUTHENTICATION.md` · `docs/AUTHORIZATION.md` · `docs/PRODUCT_REQUIREMENTS.md` · `docs/FEATURES.md` · `docs/ROADMAP.md` · `docs/DEPLOYMENT.md` · `docs/TESTING.md` · `docs/AI_AGENT_RULES.md`

---

## Project context

| Item | Value |
|------|-------|
| Product | Uzbekistan freelance marketplace |
| Stack | Next.js 16, React 19, FastAPI, Supabase |
| Architecture | Clean Architecture (`src/`) |
| Default locale | Uzbek (`uz`) |
| Primary color | `#2563EB` |
| MVP status | ~75–80% |

---

## Import paths

| Import | Path |
|--------|------|
| i18n | `@/infrastructure/i18n` |
| Regions | `@/domain/constants/regions` |
| Types | `@/domain/entities` |
| Utils | `@/shared/lib/utils` |
| UI | `@/presentation/components/ui/*` |
| API | `@/infrastructure/api/client` |

**Never:** `@/lib/*`, `@/components/*`

---

## Supabase vs API

| Frontend → Supabase | Frontend → FastAPI |
|--------------------|-------------------|
| Auth, storage upload, realtime subscribe | All business logic |

```typescript
// ✅ Supabase
supabase.auth.signInWithPassword(...)
supabase.storage.from('avatars').upload(...)

// ✅ API
await api.createOrder(...)

// ❌ Forbidden
supabase.from('orders').insert(...)
```

Full matrix: [architecture-supabase-vs-api.md](./architecture-supabase-vs-api.md)

---

## Coding rules

| # | Rule |
|---|------|
| 1 | UI text via `t('key')` — uz/ru/en |
| 2 | Regions from `@/domain/constants/regions` |
| 3 | New pages in `src/presentation/features/{feature}/` |
| 4 | Prices in so'm — no `$` |
| 5 | Minimal diff |
| 6 | Commits only when user asks |

---

## Tool usage

| Tool | When |
|------|------|
| Shell | build, test, lint, `pnpm dev:status` |
| Playwright | E2E after critical flows |
| Chrome DevTools MCP | UI bugs, console, network |
| GitHub MCP | PRs, issues (user asked) |
| Supabase MCP | schema, RLS, advisors |

**Do NOT** auto-start `pnpm dev` / `pnpm dev:api`. See [AI_SAFETY.md](./AI_SAFETY.md).

---

## Post-task verification

| Check | Command |
|-------|---------|
| Types | `pnpm type-check` |
| Lint | `pnpm lint` |
| Tests | `pnpm test` / `pnpm test:backend` |
| Build | `pnpm build` |
| Docs | Update if behavior changed |

**Never stop at implementation.**

---

## Before / after every task

**Before:** What breaks? scales? secures? improves UX/revenue/maintainability?

**After:** Build ✓ Tests ✓ Lint ✓ Docs ✓ Security ✓ UX ✓ Mobile ✓

---

## Related documents

| Document | Topic |
|----------|-------|
| [MASTER_AI_OS.md](./MASTER_AI_OS.md) | Full operating system |
| [AI_WORKFLOWS.md](./AI_WORKFLOWS.md) | Bootstrap, task patterns |
| [AI_SAFETY.md](./AI_SAFETY.md) | Secrets, servers, git |
| [AI_PROMPTS.md](./AI_PROMPTS.md) | Example prompts |
| [.cursor/README.md](../.cursor/README.md) | Rules + skills index |
