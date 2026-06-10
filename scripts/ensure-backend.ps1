# Backend 8002 ishlamasa, fon jarayonida ishga tushiradi (pnpm dev uchun)
$ErrorActionPreference = 'Continue'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Test-BackendUp {
  try {
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8002/api/v1/health' -UseBasicParsing -TimeoutSec 4
    return $r.StatusCode -eq 200
  } catch {
    return $false
  }
}

if (Test-BackendUp) {
  Write-Host 'Backend allaqachon ishlayapti (8002)' -ForegroundColor DarkGray
  exit 0
}

$log = Join-Path $Root '.dev-backend.log'
Write-Host 'Backend yoq - ishga tushirilmoqda (log: .dev-backend.log)...' -ForegroundColor Cyan

Start-Process -FilePath 'powershell.exe' `
  -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', "Set-Location '$Root'; pnpm dev:api 2>&1 | Tee-Object -FilePath '$log'" `
  -WindowStyle Hidden | Out-Null

for ($i = 0; $i -lt 45; $i++) {
  if (Test-BackendUp) {
    Write-Host 'Backend OK - http://127.0.0.1:8002' -ForegroundColor Green
    exit 0
  }
  Start-Sleep -Seconds 2
}

Write-Host 'Backend ishga tushmadi. Avval: pnpm dev:start' -ForegroundColor Red
exit 1
