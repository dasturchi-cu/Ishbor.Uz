---
name: ishbor-mvp
description: IshBor.uz MVP feature ishlab chiqish tartibi. Use when building auth, services, orders, payments, routing, database, or when user mentions MVP, backend, launch, or production features.
---

# IshBor MVP Build Skill

## O'qish tartibi (kod yozishdan oldin)
1. [AGENTS.md](../../AGENTS.md) — kod qoidalari
2. [plan-status.md](../../plan-status.md) — hozirgi holat
3. [mvp.md](../../mvp.md) — scope va sprint rejasi
4. [.cursor/rules/agent-bootstrap.mdc](../../.cursor/rules/agent-bootstrap.mdc) — to'liq indeks

## MVP bosqichlari (tartib bo'yicha)

### Bosqich A — Routing
- `app/(auth)/login/page.tsx`, `register/page.tsx`
- `app/(main)/services/page.tsx`, `dashboard/page.tsx`
- `AppProvider` state o'rniga `useRouter()` + middleware auth
- Eski `_page-content.tsx` switch ni bosqichma-bosqich almashtir

### Bosqich B — Database
```bash
pnpm add prisma @prisma/client
npx prisma init
```
- Schema: users, freelancer_profiles, client_profiles, services, orders, transactions
- Seed script demo data uchun

### Bosqich C — Auth
- `POST /api/auth/register` — rol, email, parol
- `POST /api/auth/login` — JWT cookie
- Middleware: protected routes
- Frontend: mock `setIsLoggedIn` ni olib tashla

### Bosqich D — Xizmatlar
- CRUD API + UI ulash
- Katalog DB dan o'qisin
- Filtr server-side

### Bosqich E — Buyurtma + To'lov
- Order state machine
- Click webhook
- Escrow hold/release

## Har feature uchun checklist
- [ ] API endpoint + Zod validation
- [ ] Prisma model/migration
- [ ] UI ulangan (i18n bilan)
- [ ] Error/loading states
- [ ] `pnpm build` o'tadi

## MVP dan tashqari (qilma)
AI assistant, video call, Telegram bot, skill tests, mobile app
