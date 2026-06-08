# Tezkor health tekshiruv (PowerShell)
param(
  [string]$ApiUrl = "http://127.0.0.1:8002",
  [string]$WebUrl = "http://127.0.0.1:3000"
)

$ErrorActionPreference = "Continue"
Write-Host "=== IshBor health check ===" -ForegroundColor Cyan

try {
  $h = Invoke-RestMethod "$ApiUrl/api/v1/health" -TimeoutSec 5
  Write-Host "API health: $($h.status)" -ForegroundColor Green
} catch {
  Write-Host "API health: FAIL ($ApiUrl)" -ForegroundColor Red
}

try {
  $r = Invoke-RestMethod "$ApiUrl/api/v1/health/ready" -TimeoutSec 8
  Write-Host "API ready: $($r.status) | DB: $($r.database)" -ForegroundColor Green
  if ($r.notifications) {
    Write-Host "  notifications: email=$($r.notifications.email) sms=$($r.notifications.sms) telegram=$($r.notifications.telegram)" -ForegroundColor Gray
  }
} catch {
  Write-Host "API ready: FAIL (backend/.env to'ldirilganmi?)" -ForegroundColor Yellow
}

try {
  $c = Invoke-RestMethod "$ApiUrl/api/v1/notifications/channels" -TimeoutSec 5
  Write-Host "Channels: email=$($c.email) sms=$($c.sms) telegram=$($c.telegram) redis=$($c.redis)" -ForegroundColor Gray
} catch {
  Write-Host "Channels: skip" -ForegroundColor Gray
}

try {
  $w = Invoke-WebRequest "$WebUrl" -TimeoutSec 5 -UseBasicParsing
  if ($w.StatusCode -eq 200) { Write-Host "Frontend: OK ($WebUrl)" -ForegroundColor Green }
} catch {
  Write-Host "Frontend: not running ($WebUrl) — pnpm dev" -ForegroundColor Yellow
}

Write-Host "`nTo'liq test: pnpm verify" -ForegroundColor Cyan
