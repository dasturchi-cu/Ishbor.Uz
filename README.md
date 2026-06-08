# IshBor.uz

O'zbekiston freelance marketplace — Next.js + FastAPI + Supabase.

**GitHub:** [github.com/dasturchi-cu/Ishbor.Uz](https://github.com/dasturchi-cu/Ishbor.Uz)

## Struktura

```
app/              # Next.js App Router (/login, /services, ...)
backend/          # FastAPI API (Python)
supabase/         # SQL migrations
src/
  domain/         # entities, constants
  application/    # providers
  infrastructure/ # i18n, supabase, api client, mock
  presentation/   # UI, features
  shared/         # utils
```

## Stack

| Qatlam | Texnologiya |
|--------|-------------|
| Frontend | Next.js 16, React 19, Tailwind 4 |
| Auth + DB | **Supabase** (PostgreSQL, JWT) |
| API | **FastAPI** (Python, port 8002) |

## Deploy (Vercel + GitHub)

### 1. Vercel orqali (tavsiya etiladi)

1. [vercel.com/new](https://vercel.com/new) → **Import Git Repository**
2. Repo: `dasturchi-cu/Ishbor.Uz`
3. Framework: **Next.js** (avtomatik)
4. **Environment Variables** qo'shing:

| O'zgaruvchi | Qiymat |
|------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_API_URL` | FastAPI backend URL (masalan Render/Railway) |
| `NEXT_PUBLIC_SITE_URL` | `https://your-app.vercel.app` yoki `https://ishbor.uz` |
| `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` | `true` / `false` |

5. **Deploy** — Vercel Dashboard orqali (tavsiya) yoki GitHub Actions `workflow_dispatch`.

### Tezkor buyruqlar

```powershell
pnpm dev              # frontend :3000
pnpm dev:api          # backend :8002
pnpm verify           # tsc + lint + test + build
pnpm setup:production # deploy checklist
```

### 2. GitHub Actions (ixtiyoriy)

Repo → **Settings → Secrets** ga qo'shing (`.vercel/project.json.example` ga qarang):

- `VERCEL_TOKEN` — [vercel.com/account/tokens](https://vercel.com/account/tokens)
- `VERCEL_ORG_ID` — Vercel project settings
- `VERCEL_PROJECT_ID` — Vercel project settings

Keyin GitHub → Actions → **Deploy to Vercel** → Run workflow (qo'lda).

### 3. Backend (Render)

`render.yaml` blueprint import qiling yoki Docker:

```bash
# backend/Dockerfile — health: /api/v1/health/ready
```

Vercel `NEXT_PUBLIC_API_URL` ni Render service URL ga qo'ying.

## Hujjatlar

- [QOSHISH-KERAK.md](./QOSHISH-KERAK.md) — to'liq deploy checklist
- [DEV-SERVER.md](./DEV-SERVER.md) — lokal ishga tushirish
- [.cursor/AGENTS.md](./.cursor/AGENTS.md) — Cursor AI yo'riqnomasi

## Ishga tushirish

### 1. Frontend

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

### 2. Supabase

1. [supabase.com](https://supabase.com) da loyiha yarating
2. CLI orqali migrationlarni push qiling:

```bash
supabase link --project-ref YOUR_REF
supabase db push --linked --yes
```

3. `.env.local` ga URL va anon key qo'ying

### 3. FastAPI backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
copy .env.example .env
pnpm dev:api             # yoki: uvicorn app.main:app --reload --port 8002
```

Swagger: http://127.0.0.1:8002/docs

### 4. Tekshiruv

```bash
pnpm verify   # tsc + lint + vitest + pytest + build
```
