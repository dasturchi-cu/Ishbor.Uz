# IshBor.uz — Cursor Agent Yo'riqnomasi

O'zbekiston freelance marketplace. Maqsad: Kwork/Upwork mahalliy alternativi.

## Master AI Engineering OS

**Yagona Cursor qoidasi** (har agent, har sessiya — avtomatik):

→ **[`.cursor/rules/ishbor-agent.mdc`](./.cursor/rules/ishbor-agent.mdc)** (`alwaysApply: true`)

| Resurs | Yo'l |
|--------|------|
| To'liq OS hujjati | [docs/MASTER_AI_OS.md](./docs/MASTER_AI_OS.md) |
| Skill | [skills/ishbor-master-os/SKILL.md](./skills/ishbor-master-os/SKILL.md) |
| Indeks | [.cursor/README.md](./.cursor/README.md) |

Siz hech narsa demasangiz ham: bootstrap, DDD, review gates, post-verify, tools, core qoidalar qo'llanadi.

Fayl-scoped: `react-ui.mdc`, `backend-api.mdc`, `i18n.mdc` — tegishli fayl ochilganda.

---

## Agent ish boshlash (majburiy)

**Har qanday vazifada kod yozishdan oldin** quyidagilarni o'qi:

| Tartib | Fayl | Sabab |
|--------|------|-------|
| 1 | **Bu fayl** (`AGENTS.md`) | Kod qoidalari, import yo'llari |
| 2 | [plan-status.md](./plan-status.md) | Hozirgi holat (nima tayyor) |
| 3 | [mvp.md](./mvp.md) | MVP ustuvorlik tartibi |
| 4 | Vazifaga mos **skill** | [skills/](./skills/) — `ishbor-*` |
| 5 | Kerak bo'lsa **docs** | [docs/](./docs/) — backlog, audit |
| 6 | UI bo'lsa **design** | [design/](./design/) — tokenlar, spec |

Cursor avtomatik qoida: [.cursor/rules/ishbor-agent.mdc](./.cursor/rules/ishbor-agent.mdc) (`alwaysApply: true`).

To'liq indeks: [.cursor/README.md](./.cursor/README.md)



## Tez kontekst



| Narsa | Qiymat |

|-------|--------|

| Stack | Next.js 16, React 19, TypeScript, Tailwind 4, shadcn/ui |

| Arxitektura | Clean Architecture (`src/`) |

| Til (default) | O'zbek (`uz`) — `src/infrastructure/i18n/` |

| Viloyatlar | `src/domain/constants/regions.ts` (14 ta) |

| Hozirgi holat | UI + Supabase auth + FastAPI API (~70% MVP) |
| Dizayn tokenlar | [design/figma-tokens.json](./design/figma-tokens.json) → `src/presentation/styles/tokens.css` |
| Primary rang | `#2563EB` (Kwork uslubi, ko'k) |

| MVP reja | [mvp.md](../mvp.md) |

| To'liq reja | [plan.md](../plan.md) |



## Loyiha strukturasi (Clean Architecture)



```

app/                              # Next.js entry (layout, page, globals.css)

src/

  domain/                         # Biznes qoidalari — framework dan mustaqil

    entities/                     # User, Service, Order tiplar

    constants/                    # regions.ts, routes.ts

  application/                    # Use case va ilova holati

    providers/                    # AppProvider (theme, i18n, routing)

  infrastructure/                 # Tashqi dunyo

    i18n/                         # Tarjimalar — TranslationKey

    mock/                         # Demo ma'lumotlar

    repositories/                 # Kelajakda Prisma/API

  presentation/                   # UI

    components/ui/                # shadcn

    components/layout/            # Navbar, Footer

    features/                     # auth, landing, dashboard, catalog, ...

    pages/                        # page-content.tsx (SPA router)

  shared/lib/                     # utils (cn)

```



## Import yo'llari



| Import | Yo'l |

|--------|------|

| i18n | `@/infrastructure/i18n` |

| Viloyatlar | `@/domain/constants/regions` |

| Tiplar | `@/domain/entities` |

| Mock data | `@/infrastructure/mock/mock-data` |

| Utils | `@/shared/lib/utils` |

| UI | `@/presentation/components/ui/*` |

| Provider | `@/application/providers/app-provider` |



## Routing



Sahifalar **Next.js App Router** orqali (`app/(main)/`). URL kalitlari: `src/domain/constants/routes.ts` (`PATHS`).

Canonical dashboard yo'llari: `/dashboard/*`. Eski `/wallet`, `/settings`, `/messages` → redirect.

Himoya: `middleware.ts` + `AuthGuard` (client).



## Kod qoidalari



1. **Barcha UI matnlar** — `useApp().t('key')` orqali, hardcode qilma

2. **Yangi i18n kalit** — `uz`, `ru`, `en` uchalasiga qo'sh

3. **Viloyatlar** — faqat `@/domain/constants/regions` dan import qil

4. **Yangi sahifa** — `src/presentation/features/{feature}/` ga qo'sh

5. **Narxlar** — so'm / mln so'm, `$` ishlatma

6. **Select (binafsha fon)** — `.select-auth` klassi ishlat

7. **Qatlamlar** — presentation → domain; infrastructure faqat repository orqali

8. **Minimal diff** — keraksiz refactor qilma

9. **Commit** — faqat user so'raganda



## MVP ustuvorligi



Har qanday yangi ish quyidagi tartibda:



1. URL routing (App Router)

2. Prisma schema + PostgreSQL

3. Auth API (JWT)

4. Xizmat CRUD

5. Buyurtma flow

6. Click/Payme + Escrow

7. Chat

8. Admin minimal



Batafsil: [mvp.md](../mvp.md)



## Skill indeksi

Skill fayllari: [skills/](./skills/). Review skilllar faqat foydalanuvchi aniq chaqirganda yuklanadi (`disable-model-invocation: true`).

### Qachon qaysi skill?

| Skill | Fayl | Ishlat |
|-------|------|--------|
| **ishbor-master-os** | [skills/ishbor-master-os/SKILL.md](./skills/ishbor-master-os/SKILL.md) | Master OS: DDD workflow, review gates, tool usage, post-task verify |
| **ishbor-mvp** | [skills/ishbor-mvp/SKILL.md](./skills/ishbor-mvp/SKILL.md) | MVP feature: routing, auth, xizmatlar, buyurtma, to'lov, launch tartibi |
| **ishbor-backend** | [skills/ishbor-backend/SKILL.md](./skills/ishbor-backend/SKILL.md) | FastAPI, Prisma/DB, JWT, Click/Payme, escrow, API route |
| **ishbor-i18n** | [skills/ishbor-i18n/SKILL.md](./skills/ishbor-i18n/SKILL.md) | Yangi `TranslationKey`, uz/ru/en tarjima, matn qoidalari |
| **ishbor-ui-review** | [skills/ishbor-ui-review/SKILL.md](./skills/ishbor-ui-review/SKILL.md) | Komponent tekshiruv: i18n, responsive, tokenlar, loading/empty state |
| **ishbor-product-review** | [skills/ishbor-product-review/SKILL.md](./skills/ishbor-product-review/SKILL.md) | Product audit: UX journey, onboarding, marketplace, employer/candidate tajriba |
| **ishbor-growth-review** | [skills/ishbor-growth-review/SKILL.md](./skills/ishbor-growth-review/SKILL.md) | Growth audit: SEO, acquisition, retention, referral, growth loop |
| **ishbor-security-review** | [skills/ishbor-security-review/SKILL.md](./skills/ishbor-security-review/SKILL.md) | Security audit: auth, RLS, upload, to'lov, secret, OWASP Top 10 |
| **ishbor-performance-review** | [skills/ishbor-performance-review/SKILL.md](./skills/ishbor-performance-review/SKILL.md) | Performance audit: bundle, Core Web Vitals, React, cache, DB |
| **ishbor-conversion-review** | [skills/ishbor-conversion-review/SKILL.md](./skills/ishbor-conversion-review/SKILL.md) | Conversion audit: landing, register, CTA, trust architecture, funnel |
| **taste-skill** | `~/.cursor/skills/taste-skill/SKILL.md` | Landing/portfolio/redesign: anti-slop UI, hero/CTA disiplinasi, taste-skill pre-flight |

### Build vs review (chegara)

| Tur | Skilllar | Maqsad |
|-----|----------|--------|
| **Build** | mvp, backend, i18n | Kod yozish, feature yetkazish |
| **UI checklist** | ui-review | Tez UI/regression tekshiruv |
| **Chuqur audit** | product, growth, security, performance, conversion | Production-grade hisobot + prioritet |
| **Dizayn sifati** | taste-skill | Marketing/landing vizual sifat (dashboard emas) |

Review skilllar bir-birini qoplaydi emas — har biri alohida hisobot shabloni va severity (P0–P3) beradi. Bir vazifada bir nechta review kerak bo'lsa, alohida chaqir: masalan, launch oldidan `ishbor-security-review` + `ishbor-performance-review`.

### Tez tanlash

```
"Sahifa UI buzilgan"           → ishbor-ui-review
"Buyurtma flow tushunarsiz"    → ishbor-product-review
"Google'dan topilmayapti"     → ishbor-growth-review
"RLS / auth xavfi"             → ishbor-security-review
"Sahifa sekin"                 → ishbor-performance-review
"Ro'yxatdan o'tish past"       → ishbor-conversion-review
"Landing redesign"             → taste-skill (+ kerak bo'lsa ishbor-conversion-review)
"Yangi API endpoint"           → ishbor-backend (+ ishbor-mvp)
```

## Agent vazifalari

| Vazifa | Qaysi skill/rule |
|--------|------------------|
| Yangi sahifa UI | `.cursor/rules/react-ui.mdc` |
| Tarjima qo'shish | `skills/ishbor-i18n/SKILL.md` |
| Backend/API | `skills/ishbor-backend/SKILL.md` |
| MVP feature | `skills/ishbor-mvp/SKILL.md` |
| UI checklist | `skills/ishbor-ui-review/SKILL.md` |
| Product audit | `skills/ishbor-product-review/SKILL.md` |
| Growth audit | `skills/ishbor-growth-review/SKILL.md` |
| Security audit | `skills/ishbor-security-review/SKILL.md` |
| Performance audit | `skills/ishbor-performance-review/SKILL.md` |
| Conversion audit | `skills/ishbor-conversion-review/SKILL.md` |
| Landing / redesign sifati | `taste-skill` (`~/.cursor/skills/taste-skill/SKILL.md`) |
| Umumiy standart | `.cursor/rules/ishbor-agent.mdc` |
| Har doim o'qish | `.cursor/rules/ishbor-agent.mdc` |
| To'liq skill ro'yxati | [Skill indeksi](#skill-indeksi) |



## Tez-tez xatolar



- `completed` kalitini i18n da ikki marta yozish — **qilma**

- Landing + global Footer = **ikki footer** — landing ichida footer qo'shma

- `&&` PowerShell da ishlamaydi — `;` ishlat

- Eski `@/lib/*` yoki `@/components/*` import — **ishlatma**, `src/` yo'llarini ishlat



## Dev serverlar (agent qoidasi)



**Dev serverlarni FAQAT foydalanuvchi aniq so'raganda ishga tushir.** Background terminalda `pnpm dev`, `pnpm dev:api`, `pnpm dev:all` **ishlatma** — hatto test/audit uchun ham.



**Audit/debug paytida serverlarni qayta ishga tushirma.** Avval `pnpm dev:status` tekshir.



| Qoida | Tafsilot |
|-------|----------|
| Avtomatik start | **Taqiqlangan** — agent o'zi server ochmaydi |
| Port 3000 band | `pnpm dev` / `next dev` **ishga tushirma** |
| Port 8002 band | `pnpm dev:api` / `uvicorn` **ishga tushirma** |
| Qayta ishga tushirish | Faqat `pnpm dev:stop` → port bo'sh → bitta instance |
| To'xtatish | `pnpm dev:stop` — `taskkill /F /IM node.exe` **ishlatma** (Cursor ham o'lad) |
| Holat | `pnpm dev:status` — listener PID va dublikatlar |



`scripts/lib/dev-lib.ps1` — umumiy port guard; `dev-frontend.ps1` va `dev-backend.ps1` dublikat ochmaydi.



## Arxitektura (Frontend ↔ Backend)



| Qatlam | Vazifa |
|--------|--------|
| **Frontend → Supabase** | Auth (login/register/session/logout), Storage upload (avatar, media), Realtime (chat, notifications) |
| **Frontend → Backend API** | Barcha business logic: profil, xizmatlar, buyurtmalar, to'lov, admin, … |
| **Backend → Supabase** | Validation, authorization, DB (service_role + RLS) |

**Qoida:** Bir feature uchun ikki yo'l ishlatma. `api.*` → FastAPI; to'g'ridan `supabase.from(...)` faqat auth/storage/realtime/middleware redirect flaglari.

To'liq klassifikatsiya: [docs/architecture-supabase-vs-api.md](./docs/architecture-supabase-vs-api.md).



## Test



```bash

pnpm dev:status   # listener PID (dublikat tekshiruv)

pnpm dev          # faqat 3000 bo'sh bo'lsa

pnpm dev:api      # faqat 8002 bo'sh bo'lsa

pnpm build        # production build

npx tsc --noEmit

```



## Aloqa



- Email: hello@ishbor.uz

- Telegram: @IshBorUz

