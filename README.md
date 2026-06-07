# IshBor.uz

O'zbekiston freelance marketplace — Next.js UI prototip (Clean Architecture).

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

## Hujjatlar

- [mvp.md](./mvp.md) — MVP scope va 8 haftalik reja
- [plan.md](./plan.md) — to'liq biznes/texnik reja
- [plan-status.md](./plan-status.md) — reja vs haqiqat, kamchiliklar
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
