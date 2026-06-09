# IshBor.uz dev: Supabase sync + frontend + backend hot reload
# Usage: pnpm dev:start  or  pnpm dev:all

$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Stop-PortListener($port) {
  Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object {
      Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

# Windows: kill zombie uvicorn reload workers (system python) on port 8002
function Stop-DevBackendProcesses {
  Get-CimInstance Win32_Process -Filter "Name='python.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -match 'uvicorn app\.main:app' -and $_.CommandLine -match '8002' } |
    ForEach-Object {
      Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }
  Start-Sleep -Seconds 1
  Get-NetTCPConnection -LocalPort 8002 -ErrorAction SilentlyContinue |
    ForEach-Object {
      Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

function Sync-SupabaseMigrations {
  if ($env:SUPABASE_SKIP_DB_PUSH -eq '1') {
    Write-Host "Supabase: db push skipped (SUPABASE_SKIP_DB_PUSH=1)" -ForegroundColor Yellow
    return
  }

  $cli = Get-Command supabase -ErrorAction SilentlyContinue
  if (-not $cli) {
    Write-Host "Supabase CLI not found - skip db push" -ForegroundColor Yellow
    return
  }

  if (-not (Test-Path "supabase\migrations")) {
    Write-Host "supabase/migrations missing - skip db push" -ForegroundColor Yellow
    return
  }

  Write-Host "Supabase: checking migrations..." -ForegroundColor Cyan
  $listOut = supabase migration list --linked 2>&1 | Out-String

  if ($LASTEXITCODE -ne 0) {
    Write-Host "Supabase not linked - skip db push (supabase link --project-ref REF)" -ForegroundColor Yellow
    return
  }

  $hasPending = $false
  foreach ($line in ($listOut -split "`n")) {
    # Local bor, Remote bo'sh → hali push qilinmagan
    if ($line -match '^\s+(\d{14,})\s+\|\s+\|\s+') {
      $hasPending = $true
      break
    }
  }

  if (-not $hasPending) {
    Write-Host "Supabase: database up to date (migration list)" -ForegroundColor Green
    return
  }

  Write-Host "Supabase: pending migrations - running db push..." -ForegroundColor Cyan
  $pushOut = supabase db push --linked --yes 2>&1 | Out-String
  $pushOut | Out-Host

  if ($LASTEXITCODE -ne 0) {
    if ($pushOut -match 'schema_migrations_pkey|duplicate key value violates unique constraint') {
      Write-Host "Supabase: migration version already on remote (schema_migrations duplicate)." -ForegroundColor Yellow
      Write-Host "  Fix: supabase migration list --linked  then  supabase migration repair --status applied <VERSION>" -ForegroundColor Yellow
      Write-Host '  Dev davom etadi - qolda repair qiling agar migration list notogri bolsa.' -ForegroundColor Yellow
      return
    }
    Write-Host "Supabase db push failed - stopping dev" -ForegroundColor Red
    exit 1
  }
  Write-Host "Supabase: migrations applied" -ForegroundColor Green
}

Write-Host "Stopping old dev servers..." -ForegroundColor Cyan

Stop-DevBackendProcesses

foreach ($port in @(3000, 3001, 8002)) {
  Stop-PortListener $port
}

$lockPath = Join-Path $Root ".next\dev\lock"
if (Test-Path $lockPath) {
  $lockPid = (Get-Content $lockPath -Raw -ErrorAction SilentlyContinue).Trim()
  if ($lockPid -match '^\d+$') {
    Stop-Process -Id ([int]$lockPid) -Force -ErrorAction SilentlyContinue
  }
  Remove-Item $lockPath -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Seconds 2

Stop-DevBackendProcesses

foreach ($port in @(3000, 8002)) {
  Stop-PortListener $port
}

if (-not (Test-Path "backend\.venv\Scripts\python.exe")) {
  Write-Host "ERROR: backend\.venv missing" -ForegroundColor Red
  exit 1
}

Sync-SupabaseMigrations

Write-Host ""
Write-Host "Running dev pre-check..." -ForegroundColor Cyan
powershell -ExecutionPolicy Bypass -File scripts/dev-check.ps1
if ($LASTEXITCODE -eq 1) {
  Write-Host "Pre-check failed (strict) - dev not started" -ForegroundColor Red
  exit 1
}
if ($LASTEXITCODE -eq 2) {
  Write-Host "Pre-check warnings - starting dev anyway" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Frontend http://localhost:3000 (HMR)" -ForegroundColor Green
Write-Host 'Backend  http://127.0.0.1:8002 (reload - separate process)' -ForegroundColor Green
Write-Host ""

# Windows: concurrently kills frontend when backend --reload fires SIGINT.
# Run backend in a detached process; frontend stays in this terminal.
$backendLog = Join-Path $Root ".dev-backend.log"
$backendProc = Start-Process -FilePath "powershell.exe" `
  -ArgumentList "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", "Set-Location '$Root'; pnpm dev:api 2>&1 | Tee-Object -FilePath '$backendLog'" `
  -PassThru `
  -WindowStyle Hidden

Write-Host "Backend PID $($backendProc.Id) | log: .dev-backend.log" -ForegroundColor Magenta

try {
  pnpm dev
} finally {
  Write-Host "Stopping backend..." -ForegroundColor Cyan
  Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue
  Stop-PortListener 8002
}
