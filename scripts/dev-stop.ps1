# IshBor.uz dev serverlarni to'liq to'xtatish
# Usage: pnpm dev:stop

$ErrorActionPreference = 'Continue'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Stop-PortListener($port) {
  Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object {
      Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

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

function Stop-DevBackendProcesses {
  Get-CimInstance Win32_Process -Filter "Name='python.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -match 'uvicorn app\.main:app' -and $_.CommandLine -match '8002' } |
    ForEach-Object {
      Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }
}

function Stop-DevShellWrappers {
  Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
    Where-Object {
      $cmd = $_.CommandLine
      $cmd -and (
        $cmd -match 'dev\.ps1' -or
        $cmd -match 'ensure-backend\.ps1' -or
        $cmd -match 'pnpm dev:api' -or
        ($cmd -match 'pnpm dev' -and $cmd -notmatch 'dev:start' -and $cmd -notmatch 'dev:stop')
      )
    } |
    ForEach-Object {
      Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }
}

function Clear-NextDevLock {
  $lockPath = Join-Path $Root '.next\dev\lock'
  if (-not (Test-Path $lockPath)) { return }
  try {
    $raw = Get-Content $lockPath -Raw -ErrorAction Stop
    if ($raw) {
      $text = $raw.Trim()
      try {
        $info = $text | ConvertFrom-Json
        if ($null -ne $info.pid) {
          Stop-Process -Id ([int]$info.pid) -Force -ErrorAction SilentlyContinue
        }
      } catch {
        if ($text -match '^\d+$') {
          Stop-Process -Id ([int]$text) -Force -ErrorAction SilentlyContinue
        }
      }
    }
  } catch { }
  Remove-Item $lockPath -Force -ErrorAction SilentlyContinue
}

$pidsFile = Join-Path $Root '.dev-pids.json'
if (Test-Path $pidsFile) {
  try {
    $info = Get-Content $pidsFile -Raw | ConvertFrom-Json
    foreach ($key in @('parent', 'backend', 'frontend')) {
      $pid = $info.$key
      if ($pid) {
        Stop-Process -Id ([int]$pid) -Force -ErrorAction SilentlyContinue
      }
    }
  } catch { }
  Remove-Item $pidsFile -Force -ErrorAction SilentlyContinue
}

Write-Host 'Dev serverlar to''xtatilmoqda...' -ForegroundColor Cyan

Stop-DevShellWrappers
Stop-NextDevProcesses
Stop-DevBackendProcesses

foreach ($port in @(3000, 3001, 8002)) {
  Stop-PortListener $port
}

Clear-NextDevLock

Start-Sleep -Seconds 1

Stop-NextDevProcesses
Stop-DevBackendProcesses
foreach ($port in @(3000, 3001, 8002)) {
  Stop-PortListener $port
}

$still = @()
foreach ($port in @(3000, 8002)) {
  $listen = @(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
  if ($listen.Count -gt 0) {
    $still += $port
  }
}

if ($still.Count -gt 0) {
  Write-Host "Ogohlantirish: port(lar) hali band: $($still -join ', ')" -ForegroundColor Yellow
  Write-Host '  taskkill /F /IM node.exe  yoki  qayta: pnpm dev:stop' -ForegroundColor Yellow
} else {
  Write-Host 'Dev serverlar to''xtatildi.' -ForegroundColor Green
}
