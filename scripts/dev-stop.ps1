# Dev serverlarni to'xtatish — pnpm dev:stop
$ErrorActionPreference = 'Continue'
. (Join-Path $PSScriptRoot 'lib\dev-lib.ps1')

function Get-DevBusyPorts {
    $busy = @()
    foreach ($port in @($Script:DevFrontendPort) + @(Get-DevBackendPortRange)) {
        if ((Get-DevPortListenerPids -Port $port).Count -gt 0) {
            $busy += $port
        }
    }
    return $busy
}

Stop-AllDevServers

$still = @(Get-DevBusyPorts)
if ($still.Count -gt 0) {
    Write-Host "Port(lar) hali band: $($still -join ', ') - qayta tozalash..." -ForegroundColor Yellow
    foreach ($port in $still) {
        if (Test-DevPortZombie -Port $port) {
            Repair-DevZombiePort -Port $port | Out-Null
        } else {
            Stop-DevPortListener -Port $port
        }
    }
    Start-Sleep -Milliseconds 800
    $still = @(Get-DevBusyPorts)
}

$orphans = @(Get-DevUvicornProcesses)
if ($orphans.Count -gt 0) {
    Write-Host "Orphan uvicorn: $($orphans.Count) - tozalash..." -ForegroundColor Yellow
    Stop-DevBackendProcesses
    Start-Sleep -Milliseconds 500
    $orphans = @(Get-DevUvicornProcesses)
}

if ($still.Count -gt 0 -or $orphans.Count -gt 0) {
    if ($still.Count -gt 0) {
        Write-Host "Ogohlantirish: port(lar) hali band: $($still -join ', ')" -ForegroundColor Yellow
    }
    if ($orphans.Count -gt 0) {
        Write-Host "Ogohlantirish: orphan uvicorn: $($orphans.Count)" -ForegroundColor Yellow
        foreach ($p in $orphans) {
            Write-Host "  PID $($p.ProcessId): $(Get-DevProcessCmd $p.ProcessId)" -ForegroundColor DarkGray
        }
    }
    Write-Host '  pnpm dev:stop qayta urinib ko''ring' -ForegroundColor Yellow
    exit 1
}

Write-Host 'Dev serverlar to''xtatildi.' -ForegroundColor Green
exit 0
