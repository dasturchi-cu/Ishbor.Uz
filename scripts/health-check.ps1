# Tezkor health tekshiruv (PowerShell)
param(
  [string]$ApiUrl = '',
  [string]$WebUrl = ''
)

$ErrorActionPreference = 'Continue'
. (Join-Path $PSScriptRoot 'lib\dev-lib.ps1')

if (-not $ApiUrl) { $ApiUrl = Get-DevApiBaseUrl }
if (-not $WebUrl) { $WebUrl = Get-DevFrontendUrl }

Write-Host '=== IshBor health check ===' -ForegroundColor Cyan
Write-Host ''

Assert-DevBackendReady -MaxWaitSec 15 -BaseUrl $ApiUrl

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
  Write-Host "API ready: FAIL - backend/.env to'ldirilganmi?" -ForegroundColor Yellow
}

try {
  $c = Invoke-RestMethod "$ApiUrl/api/v1/notifications/channels" -TimeoutSec 5
  Write-Host "Channels: email=$($c.email) sms=$($c.sms) telegram=$($c.telegram) redis=$($c.redis)" -ForegroundColor Gray
} catch {
  Write-Host 'Channels: skip' -ForegroundColor Gray
}

Write-Host ''
if (Wait-DevFrontendHealth -WebUrl $WebUrl -MaxWaitSec 10) {
  Write-Host "Frontend: OK ($WebUrl)" -ForegroundColor Green
} elseif (Test-DevPortInUse -Port $Script:DevFrontendPort) {
  Write-Host "Frontend: port band, lekin javob bermadi ($WebUrl)" -ForegroundColor Yellow
} else {
  Write-Host "Frontend: not running ($WebUrl) — pnpm dev" -ForegroundColor Yellow
}

Write-Host "`nTo'liq test: pnpm verify" -ForegroundColor Cyan
