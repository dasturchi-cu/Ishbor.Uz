# IshBor.uz dev pre-check: type-check, lint, backend import
param(
    [switch]$Strict
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$failed = $false

function Run-Step($label, $command) {
  Write-Host "--- $label ---" -ForegroundColor Cyan
  Invoke-Expression $command
  if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED: $label" -ForegroundColor Red
    $script:failed = $true
    if ($Strict) { exit $LASTEXITCODE }
  } else {
    Write-Host "OK: $label" -ForegroundColor Green
  }
}

Write-Host "=== Dev pre-check ===" -ForegroundColor Cyan

Run-Step "TypeScript" "pnpm type-check"
Run-Step "ESLint" "pnpm lint"

Write-Host "--- Backend import ---" -ForegroundColor Cyan
Push-Location backend
& ".\.venv\Scripts\python.exe" -c "import app.main"
Pop-Location
if ($LASTEXITCODE -ne 0) {
  Write-Host "FAILED: Backend import" -ForegroundColor Red
  $failed = $true
  if ($Strict) { exit $LASTEXITCODE }
} else {
  Write-Host "OK: Backend import" -ForegroundColor Green
}

if ($failed) {
  Write-Host ""
  Write-Host "Pre-check found errors - fix before dev or use -Strict to block start" -ForegroundColor Yellow
  if ($Strict) { exit 1 }
  exit 2
}

Write-Host ""
Write-Host "Pre-check passed" -ForegroundColor Green
