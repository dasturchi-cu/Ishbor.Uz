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
| API | **FastAPI** (Python, port 8001) |

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

5. **Deploy** — har `main` push da avtomatik yangilanadi.

### 2. GitHub Actions (ixtiyoriy)

Repo → **Settings → Secrets** ga qo'shing:

- `VERCEL_TOKEN` — [vercel.com/account/tokens](https://vercel.com/account/tokens)
- `VERCEL_ORG_ID` — `.vercel/project.json` dan
- `VERCEL_PROJECT_ID` — `.vercel/project.json` dan

Keyin `.github/workflows/deploy-vercel.yml` har push da deploy qiladi.

### 3. Backend (FastAPI)

Frontend Vercelda, API alohida hostda bo'lishi kerak (Render, Railway, Fly.io):

```bash
# Render/Railway: root = backend/, start = uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Vercel `NEXT_PUBLIC_API_URL` ni shu backend URL ga qo'ying.

## Hujjatlar

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
2. SQL Editor ga `supabase/migrations/20240607000000_initial.sql` ni joylashtiring
3. `.env.local` ga URL va anon key qo'ying

### 3. FastAPI backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8001
```

Swagger: http://localhost:8001/docs

### 4. Yangi migration (loyihalar, chat, sharhlar)

Supabase SQL Editor ga `supabase/migrations/20240608000000_projects_messages_reviews.sql` ni joylashtiring.
