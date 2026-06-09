# IshBor.uz — Cursor Agent Yo'riqnomasi

O'zbekiston freelance marketplace. Maqsad: Kwork/Upwork mahalliy alternativi.

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

Cursor avtomatik qoida: [.cursor/rules/agent-bootstrap.mdc](./.cursor/rules/agent-bootstrap.mdc) (`alwaysApply: true`).

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



## Agent vazifalari



| Vazifa | Qaysi skill/rule |

|--------|------------------|

| Yangi sahifa UI | `.cursor/rules/react-ui.mdc` |

| Tarjima qo'shish | `skills/ishbor-i18n/SKILL.md` |

| Backend/API | `skills/ishbor-backend/SKILL.md` |

| MVP feature | `skills/ishbor-mvp/SKILL.md` |

| UI review | `skills/ishbor-ui-review/SKILL.md` |

| Umumiy standart | `.cursor/rules/project-core.mdc` |

| Har doim o'qish | `.cursor/rules/agent-bootstrap.mdc` |



## Tez-tez xatolar



- `completed` kalitini i18n da ikki marta yozish — **qilma**

- Landing + global Footer = **ikki footer** — landing ichida footer qo'shma

- `&&` PowerShell da ishlamaydi — `;` ishlat

- Eski `@/lib/*` yoki `@/components/*` import — **ishlatma**, `src/` yo'llarini ishlat



## Test



```bash

pnpm dev      # localhost:3000

pnpm build    # production build

npx tsc --noEmit

```



## Aloqa



- Email: hello@ishbor.uz

- Telegram: @IshBorUz

