# IshBor.uz — production deploy oldidan tekshiruv (PowerShell)
param(
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "=== IshBor.uz preflight ===" -ForegroundColor Cyan

$required = @(
    @{ Path = ".env.local"; Hint = "cp .env.example .env.local" },
    @{ Path = "backend/.env"; Hint = "cp backend/.env.example backend/.env" }
)

foreach ($item in $required) {
    if (-not (Test-Path $item.Path)) {
        Write-Host "MISSING: $($item.Path) — $($item.Hint)" -ForegroundColor Red
        exit 1
    }
    Write-Host "OK: $($item.Path)" -ForegroundColor Green
}

Write-Host "`n--- pnpm verify ---" -ForegroundColor Cyan
if ($SkipBuild) {
    pnpm type-check
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    pnpm lint
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    pnpm test
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    pnpm test:backend
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} else {
    pnpm verify
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "`n--- Supabase migrations ---" -ForegroundColor Cyan
supabase db push --linked --dry-run 2>&1 | Out-Host
if ($LASTEXITCODE -ne 0) {
    Write-Host "Supabase dry-run failed (link qiling: supabase link --project-ref REF)" -ForegroundColor Yellow
} else {
    Write-Host "Supabase: remote up to date or dry-run OK" -ForegroundColor Green
}

Write-Host "`n=== Preflight passed ===" -ForegroundColor Green
Write-Host "Keyingi qadam: Render (backend) + Vercel (frontend) deploy — QOSHISH-KERAK.md §3–4"
