# Security Production Setup (10/10)

## 1. Supabase migrations

```powershell
pnpm db:push
```

Kerakli migrationlar: `20240629960000`, `20240629970000`, `20240629980000`.

## 2. Backend `.env` (production)

```env
ENVIRONMENT=production
DOCS_ENABLED=false
PAYMENT_WEBHOOK_SECRET=<random>
CRON_SECRET=<random>
TURNSTILE_SECRET_KEY=<cloudflare-turnstile-secret>
REQUIRE_EMAIL_VERIFIED=false
SESSION_IDLE_MINUTES=120
```

## 3. Frontend env (Vercel)

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<cloudflare-turnstile-site-key>
NEXT_PUBLIC_SESSION_IDLE_MINUTES=120
```

## 4. Supabase Dashboard

- Auth → Email → **Confirm email** ixtiyoriy (default: o‘chiq). Tasdiqlanmagan bo‘lsa dashboardda banner ko‘rsatiladi, kirish bloklanmaydi.
- Auth → Email → **Prevent use of leaked passwords (HIBP)** — faqat **Pro plan** da yoqiladi. Free planda Security Advisor warning qolishi mumkin (kutilgan).
- `config.toml`: `minimum_password_length = 8`, `password_requirements = lower_upper_letters_digits` (local + yangi deploylar).
- Auth → CAPTCHA (ixtiyoriy, Turnstile allaqachon frontendda)

### Security Advisor — `deny_financial_mutation`

Migration `20240629991000_security_advisor_deny_financial.sql` — EXECUTE faqat `postgres` / `service_role` (trigger ishlashda davom etadi).

## 5. GitHub org

- Settings → Member privileges → **Require 2FA**
- Settings → Branches → `main` protection: PR required, CI + CodeQL pass
- Settings → Code security → Secret scanning ON

## 6. Backup cron (daily)

```bash
curl -X POST "https://api.ishbor.uz/api/v1/trust/jobs/backup-checkpoint?backup_type=scheduled" \
  -H "X-Cron-Secret: $CRON_SECRET"
```

Haqiqiy restore: Supabase Dashboard → Database → Backups / PITR.

## 7. Weekly backup

Xuddi daily, `backup_type=weekly` (har yakshanba cron).
