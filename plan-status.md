# IshBor.uz — Reja vs Haqiqat (2026-06-12 yangilangan)



> Asosiy reja: [plan.md](./plan.md) | MVP: [mvp.md](./mvp.md) | Agent: [AGENTS.md](./AGENTS.md) | Qoida: [.cursor/rules/ishbor-agent.mdc](./.cursor/rules/ishbor-agent.mdc)



## Hozirgi holat



| Bo'lim | Holat |

|--------|-------|

| Frontend UI (11+ sahifa) | ✅ ~95% |

| App Router URL | ✅ `/login`, `/services`, `/dashboard`, ... |

| Supabase Auth | ✅ register/login + middleware (API session-flags) |

| FastAPI backend | ✅ profiles, services, orders, projects, messages, reviews, admin, escrow |

| Profil saqlash | ✅ Sozlamalar + API |

| Xizmat yaratish | ✅ `/services/create` |

| Buyurtma flow | ✅ pending → active → delivered → completed / disputed |

| Loyiha joylashtirish | ✅ `/post-project` |

| Freelancer profil | ✅ `/freelancer/[id]` |

| Chat (REST + realtime) | ✅ `/messages`, batch inbox API |

| Sharh/reyting | ✅ tugallangan buyurtmadan keyin |

| Admin panel | ✅ `/admin` (is_admin kerak) |

| Terms + Privacy | ✅ `/terms`, `/privacy` |

| SEO | ✅ sitemap (kengaytirilgan), OG image, noindex, JSON-LD |

| Wallet sandbox | ✅ topup + pay-wallet + `/payments/wallet/summary` |

| Escrow simulyatsiyasi | ✅ hold/release/refund (sandbox) |

| Security hardening | ✅ rate limits, CAPTCHA register, RLS migrations |

| **Click/Payme live** | ⏸️ **Deferred** — merchant credential kerak (kod tayyor) |

| **Deploy production** | ⬜ Final launch qadami |



**Umumiy:** MVP ~90% (sandbox to'liq; live to'lov credential + deploy qoldi)



## ⏸️ Deferred: Payment activation (final launch step)



Click va Payme **kod, webhook, schema, UI tayyor** — faqat merchant credential yo'q.



| Narsa | Holat |

|-------|-------|

| Sandbox wallet / pay-wallet | ✅ Ishlaydi |

| Click/Payme webhook handlers | ✅ Kod tayyor |

| `payment_intents` schema | ✅ Tayyor |

| Checkout UI (`payment-checkout-flow`) | ✅ Sandbox + "test mode" badge |

| Live provider toggle | ⏸️ `CLICK_*` / `PAYME_*` env bo'lganda yoqiladi |



**Keyingi qadam (user):** merchant hisob → `.env` → `NEXT_PUBLIC_PAYMENTS_ENABLED=true` → production webhook URL



## Production audit sprint (2026-06-12)



| Blok | Holat |

|------|-------|

| DB migrations `20240631170000` + `20240631180000` | ✅ Repo; `pnpm db:push` |

| Middleware → FastAPI session-flags | ✅ |

| Security (rate limit, CAPTCHA, redacted health) | ✅ |

| SEO (sitemap, OG, noindex) | ✅ |

| Performance (wallet summary, landing SSR) | ✅ |

| UX (lang sync, admin i18n, test badge) | ✅ |



## Dev serverlar



```powershell

pnpm dev:start   # port tozalash + migration + frontend + backend

pnpm dev:all     # faqat frontend (HMR) + backend (--reload)

```



## Siz qilishingiz kerak (launch uchun)



1. **Supabase** — yangi migrationlar: `pnpm db:push` + `pnpm db:verify`

2. **Supabase Dashboard** — [Leaked password protection](https://supabase.com/docs/guides/auth/password-security) yoqing

3. **Admin** (ixtiyoriy): `update profiles set is_admin = true where email = '...'`

4. **Click yoki Payme** — merchant credential → deferred sprint (oxirgi qadam)

5. **Deploy** — Vercel + Supabase + Railway



## Keyingi bosqich



1. Production deploy (Vercel + API host) — [docs/LAUNCH_CHECKLIST.md](./docs/LAUNCH_CHECKLIST.md)

2. Click yoki Payme **live** credential (launch day — §3 checklist)

3. Email verification enforcement (`REQUIRE_EMAIL_VERIFIED=true`) — production da

4. Sentry DSN production da

5. Autonomous verification hisobot: [docs/FINAL_AUTONOMOUS_REPORT.md](./docs/FINAL_AUTONOMOUS_REPORT.md) (2026-06-12, E2E 63/63)


