# Production deploy checklist (PowerShell)
# Credential kerak — faqat qadamlarni ko'rsatadi

Write-Host "=== IshBor.uz Production Deploy ===" -ForegroundColor Cyan

Write-Host "`n1. RENDER (backend API)" -ForegroundColor Yellow
Write-Host "   - render.yaml import yoki Docker deploy"
Write-Host "   - Env: SUPABASE_*, CORS_ORIGINS, PAYMENT_WEBHOOK_SECRET"
Write-Host "   - Ixtiyoriy: REDIS_URL, RESEND_API_KEY, ESKIZ_*, TELEGRAM_BOT_TOKEN"
Write-Host "   - Health: https://YOUR-API.onrender.com/api/v1/health/ready"

Write-Host "`n2. VERCEL (frontend)" -ForegroundColor Yellow
Write-Host "   - Import GitHub repo dasturchi-cu/Ishbor.Uz"
Write-Host "   - NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY"
Write-Host "   - NEXT_PUBLIC_API_URL = Render URL"
Write-Host "   - NEXT_PUBLIC_SITE_URL = https://ishbor.uz"
Write-Host "   - MIDDLEWARE_CACHE_SECRET = random 32+ byte (openssl rand -hex 32)"
Write-Host "   - NEXT_PUBLIC_SENTRY_DSN, SENTRY_DSN (ixtiyoriy monitoring)"

Write-Host "`n3. SUPABASE" -ForegroundColor Yellow
Write-Host "   - Auth redirect: https://ishbor.uz/**"
Write-Host "   - supabase db push --linked --yes"
Write-Host "   - Admin: update profiles set is_admin=true where email='...'"

Write-Host "`n4. TELEGRAM BOT (ixtiyoriy)" -ForegroundColor Yellow
Write-Host "   - @BotFather -> token -> TELEGRAM_BOT_TOKEN"
Write-Host "   - Webhook: POST https://API/api/v1/notifications/telegram/webhook"
Write-Host "   - Header: X-Telegram-Bot-Api-Secret-Token = TELEGRAM_WEBHOOK_SECRET"

Write-Host "`n5. TO'LOV (keyinroq)" -ForegroundColor Yellow
Write-Host "   - Click/Payme merchant -> CLICK_*, PAYME_* env"
Write-Host "   - Webhook URL: https://API/api/v1/payments/webhooks/click/complete"

Write-Host "`nTekshiruv: pnpm preflight" -ForegroundColor Green
