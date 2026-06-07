# IshBor.uz FastAPI Backend

Supabase (PostgreSQL + Auth) + FastAPI biznes logikasi.

## O'rnatish

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

`.env` ni to'ldiring — Supabase Dashboard → Project Settings → API.

## Ishga tushirish

```bash
uvicorn app.main:app --reload --port 8000
```

- API: http://localhost:8000
- Swagger: http://localhost:8000/docs

## Supabase migration

Supabase SQL Editor ga `supabase/migrations/20240607000000_initial.sql` ni joylashtiring yoki:

```bash
supabase db push
```

## Endpointlar

| Method | URL | Auth |
|--------|-----|------|
| GET | `/api/v1/health` | Yo'q |
| GET | `/api/v1/profiles/me` | Ha |
| PATCH | `/api/v1/profiles/me` | Ha |
| GET | `/api/v1/services` | Yo'q |
| POST | `/api/v1/services` | Freelancer |
| GET | `/api/v1/orders` | Ha |
| POST | `/api/v1/orders` | Client |

Auth: Supabase JWT — `Authorization: Bearer <access_token>`
