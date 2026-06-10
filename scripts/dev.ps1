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

# Eski next dev (port 3000/3001) — boshqa terminal yoki Cursor task qoldirgan bo'lishi mumkin
function Stop-NextDevProcesses {
  Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
    Where-Object {
      $cmd = $_.CommandLine
      $cmd -and ($cmd -match 'next dev' -or $cmd -match 'next\\dist\\bin\\next')
    } |
    ForEach-Object {
      Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }
}

function Wait-BackendHealthy {
  param([int]$MaxSeconds = 90)
  $deadline = (Get-Date).AddSeconds($MaxSeconds)
  Write-Host 'Backend kutilmoqda...' -ForegroundColor DarkGray
  while ((Get-Date) -lt $deadline) {
    try {
      $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8002/api/v1/health' -UseBasicParsing -TimeoutSec 10
      if ($r.StatusCode -eq 200) {
        Write-Host 'Backend health OK' -ForegroundColor Green
        return $true
      }
    } catch {
      Write-Host "  backend... $($_.Exception.Message)" -ForegroundColor DarkGray
    }
    Start-Sleep -Seconds 2
  }
  Write-Host 'Backend javob bermadi - .dev-backend.log ni tekshiring' -ForegroundColor Red
  return $false
}

function Wait-FrontendHealthy {
  param([int]$MaxSeconds = 180)
  $deadline = (Get-Date).AddSeconds($MaxSeconds)
  Write-Host 'Frontend kutilmoqda (birinchi compile 30-90s)...' -ForegroundColor DarkGray
  while ((Get-Date) -lt $deadline) {
    $listen = @(Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue)
    if ($listen.Count -gt 0) {
      try {
        $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3000/' -UseBasicParsing -TimeoutSec 120
        if ($r.StatusCode -eq 200) {
          Write-Host 'Frontend health OK - http://localhost:3000' -ForegroundColor Green
          return $true
        }
      } catch {
        Write-Host "  compile/hold... $($_.Exception.Message)" -ForegroundColor DarkGray
      }
    }
    Start-Sleep -Seconds 3
  }
  Write-Host 'Frontend javob bermadi - .dev-frontend.log ni oching' -ForegroundColor Red
  return $false
}

# Next.js 16: .next/dev/lock JSON { pid, port, appUrl, ... }
function Clear-NextDevLock {
  $lockPath = Join-Path $Root '.next\dev\lock'
  if (-not (Test-Path $lockPath)) { return }

  $raw = $null
  try {
    $raw = Get-Content $lockPath -Raw -ErrorAction Stop
  } catch {
    # Lock fayl boshqa next jarayoni tomonidan ushlab turilgan — port orqali tozalash yetarli
    return
  }

  if ($raw) {
    $text = $raw.Trim()
    try {
      $info = $text | ConvertFrom-Json
      if ($null -ne $info.pid) {
        Stop-Process -Id ([int]$info.pid) -Force -ErrorAction SilentlyContinue
        Write-Host "Stopped stale next dev PID $($info.pid) from lockfile" -ForegroundColor DarkYellow
        Start-Sleep -Milliseconds 500
      }
    } catch {
      if ($text -match '^\d+$') {
        Stop-Process -Id ([int]$text) -Force -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 500
      }
    }
  }

  Remove-Item $lockPath -Force -ErrorAction SilentlyContinue
}

function Assert-PortFree($port) {
  $listeners = @(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
  if ($listeners.Count -eq 0) { return }
  $pids = $listeners | ForEach-Object { $_.OwningProcess } | Sort-Object -Unique
  Write-Host "ERROR: port $port hali band (PID: $($pids -join ', '))" -ForegroundColor Red
  Write-Host "  taskkill /F /PID $($pids[0])" -ForegroundColor Yellow
  Write-Host "  yoki: taskkill /F /IM node.exe  keyin  pnpm dev:start" -ForegroundColor Yellow
  exit 1
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
    # Local bor, Remote bo'sh - hali push qilinmagan
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

Stop-NextDevProcesses
Stop-DevBackendProcesses

foreach ($port in @(3000, 3001, 8002)) {
  Stop-PortListener $port
}

Clear-NextDevLock

Start-Sleep -Seconds 2

Stop-NextDevProcesses
Stop-DevBackendProcesses

foreach ($port in @(3000, 3001, 8002)) {
  Stop-PortListener $port
}

Clear-NextDevLock

if (-not (Test-Path "backend\.venv\Scripts\python.exe")) {
  Write-Host "ERROR: backend\.venv missing" -ForegroundColor Red
  exit 1
}

Sync-SupabaseMigrations

if ($env:DEV_SKIP_PRECHECK -eq '1') {
  Write-Host "Dev pre-check skipped (DEV_SKIP_PRECHECK=1)" -ForegroundColor Yellow
} else {
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

$pidsFile = Join-Path $Root '.dev-pids.json'
@{
  parent   = $PID
  backend  = $backendProc.Id
  frontend = $null
  started  = (Get-Date).ToString('o')
} | ConvertTo-Json | Set-Content $pidsFile -Encoding utf8

Write-Host "Backend PID $($backendProc.Id) | log: .dev-backend.log" -ForegroundColor Magenta

$backendOk = Wait-BackendHealthy
if (-not $backendOk) {
  if (Test-Path $backendLog) {
    Write-Host '--- .dev-backend.log (oxirgi 25 qator) ---' -ForegroundColor Yellow
    Get-Content $backendLog -Tail 25 -ErrorAction SilentlyContinue
  }
  Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue
  exit 1
}

Clear-NextDevLock
Assert-PortFree 3000

@{
  parent   = $PID
  backend  = $backendProc.Id
  frontend = $PID
  started  = (Get-Date).ToString('o')
} | ConvertTo-Json | Set-Content $pidsFile -Encoding utf8

Write-Host 'Frontend shu terminalda (Turbopack HMR) | Ctrl+C = to''xtatish' -ForegroundColor Cyan
Write-Host 'Brauzer: http://localhost:3000' -ForegroundColor Green
Write-Host ''

try {
  pnpm dev
} finally {
  Write-Host 'Stopping dev servers...' -ForegroundColor Cyan
  Stop-NextDevProcesses
  Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue
  Stop-DevBackendProcesses
  Stop-PortListener 3000
  Stop-PortListener 8002
  Clear-NextDevLock
  Remove-Item $pidsFile -Force -ErrorAction SilentlyContinue
}
