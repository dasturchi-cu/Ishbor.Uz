# Dev tayyorgarlik: port tozalash + migration + pre-check
# Serverlarni ISHGA TUSHIRMAYDI. Keyin:
#   Terminal 1: pnpm dev:api
#   Terminal 2: pnpm dev
#   yoki bitta terminal: pnpm dev:all

$ErrorActionPreference = 'Continue'
. (Join-Path $PSScriptRoot 'lib\dev-lib.ps1')
Set-Location $Script:DevRoot

Write-Host 'Eski dev serverlar tozalanmoqda...' -ForegroundColor Cyan
Stop-AllDevServers -Quiet

Invoke-DevSubScript -Name 'dev-clean-turbopack-cache.ps1' -ArgumentList 2 | Out-Null

if (-not (Test-Path 'backend\.venv\Scripts\python.exe')) {
    Write-Host 'ERROR: backend\.venv topilmadi' -ForegroundColor Red
    exit 1
}

Sync-DevSupabaseMigrations

if ($env:DEV_SKIP_PRECHECK -eq '1') {
    Write-Host 'Dev pre-check o''tkazildi (DEV_SKIP_PRECHECK=1)' -ForegroundColor Yellow
} else {
    Write-Host ''
    Write-Host 'Dev pre-check...' -ForegroundColor Cyan
    $code = Invoke-DevSubScript -Name 'dev-check.ps1'
    if ($code -eq 1) {
        Write-Host 'Pre-check xato (strict) — dev boshlanmadi' -ForegroundColor Red
        exit 1
    }
    if ($code -eq 2) {
        Write-Host 'Pre-check ogohlantirishlari bor — dev davom etadi' -ForegroundColor Yellow
    }
}

Write-Host ''
Write-Host '=== Tayyor ===' -ForegroundColor Green
Write-Host ''
Write-Host '  pnpm dev:api      - backend  (port 8002)' -ForegroundColor Cyan
Write-Host '  pnpm dev          - frontend (port 3000)' -ForegroundColor Cyan
Write-Host '  pnpm dev:all      - ikkalasi bir terminalda' -ForegroundColor Cyan
Write-Host ''
Write-Host '  pnpm dev:status   - holat' -ForegroundColor DarkGray
Write-Host '  pnpm dev:stop     - to''xtatish' -ForegroundColor DarkGray
Write-Host ''
exit 0
