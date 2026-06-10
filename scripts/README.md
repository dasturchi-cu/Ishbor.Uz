# IshBor.uz — scripts

PowerShell skriptlari. Barcha buyruqlar loyiha root dan: `pnpm <script>`.

## Dev workflow

| Buyruq | Vazifa |
|--------|--------|
| `pnpm dev:prepare` | Port tozalash, migratsiya, pre-check (server **ochmaydi**) |
| `pnpm dev:api` | Backend — FastAPI `:8002` |
| `pnpm dev` | Frontend — Next.js `:3000` |
| `pnpm dev:all` | Ikkala server bir terminalda |
| `pnpm dev:status` | Port holati, dublikat tekshiruv |
| `pnpm dev:stop` | Barcha dev serverlarni to'xtatish |
| `pnpm dev:clean-cache` | Turbopack cache tozalash |

**Tartib:** `dev:stop` → `dev:api` + `dev` (yoki `dev:all`).

Port band bo'lsa yangi instance ochilmaydi (port guard).

## Umumiy kutubxona

`lib/dev-lib.ps1` — port, jarayon to'xtatish, backend/frontend health (kutish bilan), Supabase migration.

| Funksiya | Vazifa |
|----------|--------|
| `Wait-DevBackendHealth` | Backend `/health` tayyor bo'lguncha kutadi (dev:all race fix) |
| `Assert-DevBackendReady` | Audit skriptlar — kutadi, bo'lmasa `exit 1` |
| `Wait-DevFrontendHealth` | Frontend javob berishini kutadi |
| `Show-DevBackendStartupHint` | `dev-frontend.ps1` — 3 holatli xabar (OK / port band / yo'q) |

Dev skriptlari shu faylni dot-source qiladi; takror kod yozmang.

## Tekshiruv va audit

| Buyruq | Skript |
|--------|--------|
| `pnpm dev:check` | `dev-check.ps1` — type-check, lint, backend import |
| `pnpm preflight` | `preflight.ps1` — deploy oldidan to'liq tekshiruv |
| `pnpm health` | `health-check.ps1` — API + frontend health |
| `pnpm check:storage` | `check-storage.ps1` — Supabase bucketlar |
| `pnpm audit:ui` | `ui-action-audit.ps1` |
| `pnpm audit:api` | `api-connection-audit.ps1` |
| `pnpm lighthouse` | `lighthouse.ps1` |

## Bir martalik vositalar

`tools/` — encoding fix, migration yordamchi skriptlar (odatiy dev da kerak emas).

## Agent qoidalari

- Agent **o'zi** `pnpm dev` / `pnpm dev:api` / `pnpm dev:all` ishga tushirmaydi — faqat user so'raganda
- Audit paytida serverlarni qayta ishga tushirmang — avval `pnpm dev:status`
- Port 3000/8002 band → yangi `dev` / `dev:api` **ishlatmang**
- Qayta ishga tushirish: faqat `pnpm dev:stop` → keyin bitta instance
- To'xtatish: `pnpm dev:stop` — `taskkill /F /IM node.exe` ishlatmang (Cursor node ham o'lad)
