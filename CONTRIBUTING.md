# Contributing to IshBor.uz

Thank you for your interest in contributing to IshBor.uz. This document defines how we work together on the Uzbekistan freelance marketplace.

---

## Table of contents

1. [Code of conduct](#code-of-conduct)
2. [Getting started](#getting-started)
3. [Development workflow](#development-workflow)
4. [Architecture rules](#architecture-rules)
5. [Coding standards](#coding-standards)
6. [Internationalization](#internationalization)
7. [Testing](#testing)
8. [Pull request process](#pull-request-process)
9. [Commit conventions](#commit-conventions)

---

## Code of conduct

All contributors must follow [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md). Harassment, discrimination, or abusive behavior will not be tolerated.

---

## Getting started

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 22+ |
| pnpm | 9+ |
| Python | 3.12+ |
| Supabase CLI | Latest |
| Git | 2.40+ |

### Setup

```powershell
git clone https://github.com/dasturchi-cu/Ishbor.Uz.git
cd Ishbor.Uz
pnpm install

# Backend virtual environment
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
cd ..

# Link Supabase and apply migrations
supabase link --project-ref YOUR_REF
pnpm db:push
```

Copy environment files:

- `.env.local` from team vault or `.env.example`
- `backend/.env` from `backend/.env.example`

Read before coding:

1. [AGENTS.md](./AGENTS.md) — agent and import rules
2. [plan-status.md](./plan-status.md) — current project state
3. [mvp.md](./mvp.md) — MVP priorities
4. [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — system boundaries

---

## Development workflow

### Branch strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code |
| `develop` | Integration branch (if used) |
| `feature/*` | New features |
| `fix/*` | Bug fixes |
| `docs/*` | Documentation only |

### Local development

```powershell
pnpm dev:status    # Check ports 3000 / 8002
pnpm dev:start     # Start frontend + backend + migrations
pnpm dev:stop      # Stop all dev processes
```

**Do not** run multiple instances on the same port. Use `pnpm dev:stop` before restarting.

### Verify before PR

```powershell
pnpm verify              # type-check, lint, frontend test, build
pnpm test:backend        # pytest
pnpm test:e2e            # Playwright (requires backend running in CI)
```

---

## Architecture rules

### Clean Architecture layers

```
presentation → application → domain
infrastructure → domain
```

- **domain/** — types, constants, validators (no framework imports)
- **application/** — providers, app state
- **infrastructure/** — API client, Supabase, i18n
- **presentation/** — React components and features
- **shared/** — utilities and hooks

### Supabase vs API boundary

| Use Supabase directly | Use FastAPI only |
|----------------------|------------------|
| Auth (login, register, MFA) | Profiles, orders, payments |
| Storage upload | Escrow, wallet, withdrawals |
| Realtime subscribe | Chat send, admin, moderation |

Never use `supabase.from('orders').insert()` from the frontend. See [docs/architecture-supabase-vs-api.md](./docs/architecture-supabase-vs-api.md).

### Import paths

| Do | Don't |
|----|-------|
| `@/infrastructure/i18n` | `@/lib/i18n` |
| `@/domain/constants/regions` | Hardcoded region lists |
| `@/presentation/components/ui/*` | `@/components/ui/*` |

---

## Coding standards

### TypeScript / React

- Strict TypeScript — no `any` without justification
- Functional components with hooks
- Use `cn()` from `@/shared/lib/utils` for class merging
- shadcn/ui components from `@/presentation/components/ui`
- Tailwind 4 utility classes; design tokens from `tokens.css`

### Python / FastAPI

- Routers in `backend/app/routers/`
- Business logic in `backend/app/*_service.py`
- Pydantic schemas for request/response validation
- Use `require_user_auth` dependency for protected routes
- Financial operations via service_role + RPC, never direct client UPDATE

### General

- **Minimal diff** — change only what the task requires
- **No hardcoded UI strings** — use `useApp().t('key')`
- **Prices in so'm** — never use `$` in product UI
- **Regions** — import from `@/domain/constants/regions` (14 regions)

---

## Internationalization

Every new UI string requires keys in **three locales**:

- `uz` (default)
- `ru`
- `en`

Files live in `src/infrastructure/i18n/`. See [skills/ishbor-i18n/SKILL.md](./skills/ishbor-i18n/SKILL.md).

```typescript
const { t } = useApp();
return <h1>{t('myFeature.title')}</h1>;
```

---

## Testing

| Layer | Tool | Command |
|-------|------|---------|
| Frontend unit | Vitest | `pnpm test` |
| Backend unit | pytest | `pnpm test:backend` |
| E2E | Playwright | `pnpm test:e2e` |
| Type safety | TypeScript | `pnpm type-check` |
| Lint | ESLint | `pnpm lint` |

Add tests for:

- New API endpoints (backend `tests/`)
- Critical user flows (E2E in `e2e/`)
- Domain validators and utilities

See [docs/TESTING.md](./docs/TESTING.md).

---

## Pull request process

1. **Fork / branch** from `main`
2. **Implement** with focused commits
3. **Run** `pnpm verify` locally
4. **Open PR** with:
   - Summary of changes
   - Screenshots for UI changes
   - Test plan checklist
   - Link to issue (if applicable)
5. **CI must pass** — frontend, backend, CodeQL
6. **Review** — at least one maintainer approval
7. **Merge** — squash preferred for feature branches

### PR checklist

- [ ] No secrets in code or commits
- [ ] i18n keys added (uz/ru/en) for new strings
- [ ] API changes documented in `docs/API_REFERENCE.md`
- [ ] Migration added for schema changes (`supabase/migrations/`)
- [ ] No duplicate footers on landing pages
- [ ] `pnpm verify` passes

---

## Commit conventions

Use clear, imperative messages:

```
feat(orders): add auto-release countdown UI
fix(auth): resolve race in useProtectedLoader
docs(api): document wallet topup endpoints
chore(ci): bump Node to 22
```

Focus on **why**, not just what.

---

## Questions?

- **Email:** hello@ishbor.uz
- **Telegram:** [@IshBorUz](https://t.me/IshBorUz)
- **Architecture:** [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- **AI agents:** [docs/AI_AGENT_RULES.md](./docs/AI_AGENT_RULES.md)
