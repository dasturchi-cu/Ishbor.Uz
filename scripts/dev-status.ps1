# Dev server holati — pnpm dev:status
$ErrorActionPreference = 'Continue'
. (Join-Path $PSScriptRoot 'lib\dev-lib.ps1')

$fePids = Get-DevPortListenerPids -Port $Script:DevFrontendPort
$bePort = Read-DevBackendPort
$bePids = Get-DevPortListenerPids -Port $bePort

$nextProcs = @(Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -match 'next dev|start-server\.js' })
$uvicornProcs = @(Get-DevUvicornProcesses)

Write-Host '=== IshBor dev status ===' -ForegroundColor Cyan
Write-Host ''

if ($fePids.Count -eq 0) {
    Write-Host "Frontend (port $($Script:DevFrontendPort)): NOT RUNNING" -ForegroundColor Red
} else {
    Write-Host "Frontend (port $($Script:DevFrontendPort)): RUNNING - PID $($fePids -join ', ')" -ForegroundColor Green
    foreach ($id in $fePids) { Write-Host "  $id : $(Get-DevProcessCmd $id)" }
    $feUrl = Get-DevFrontendUrl
    $feOk = Test-DevFrontendHealth -WebUrl $feUrl -TimeoutSec 3
    if (-not $feOk) {
        Write-Host '  health: kutilmoqda...' -ForegroundColor DarkGray
        $feOk = Wait-DevFrontendHealth -WebUrl $feUrl -MaxWaitSec 10
    }
    if ($feOk) {
        Write-Host "  health: OK ($feUrl)" -ForegroundColor Green
    } else {
        Write-Host "  health: FAIL (port band, sahifa javob bermadi)" -ForegroundColor Yellow
    }
}

Write-Host ''

if ($bePids.Count -eq 0) {
    Write-Host "Backend (port ${bePort}): NOT RUNNING" -ForegroundColor Red
} else {
    Write-Host "Backend (port ${bePort}): RUNNING - PID $($bePids -join ', ')" -ForegroundColor Green
    foreach ($id in $bePids) { Write-Host "  $id : $(Get-DevProcessCmd $id)" }
    $healthUrl = "$(Get-DevApiBaseUrl)/api/v1/health"
    $healthOk = Test-DevBackendHealth -TimeoutSec 3
    if (-not $healthOk) {
        Write-Host '  health: kutilmoqda...' -ForegroundColor DarkGray
        $healthOk = Wait-DevBackendHealth -MaxWaitSec 10
    }
    if ($healthOk) {
        Write-Host "  health: OK ($healthUrl)" -ForegroundColor Green
    } else {
        Write-Host "  health: FAIL (port band, /health javob bermadi)" -ForegroundColor Yellow
    }
}

Write-Host ''
Write-Host "Next.js jarayonlari: $($nextProcs.Count) (listener: $($fePids.Count))" -ForegroundColor DarkGray
Write-Host "Uvicorn jarayonlari: $($uvicornProcs.Count) (listener: $($bePids.Count))" -ForegroundColor DarkGray

# uvicorn --reload: supervisor + worker, 1 listener — normal
$roots = @(Get-DevUvicornRootProcesses)
$reloadPair = ($uvicornProcs.Count -le 2 -and $roots.Count -le 1 -and $bePids.Count -le 1)
$orphanUvicorn = @($uvicornProcs | Where-Object {
    $procId = $_.ProcessId
    if ($bePids -contains $procId) { return $false }
    $isDescendant = $false
    foreach ($listenerPid in $bePids) {
        if (Test-DevProcessDescendant -AncestorPid $procId -DescendantPid $listenerPid) {
            $isDescendant = $true
            break
        }
    }
    -not $isDescendant
})
if ($orphanUvicorn.Count -gt 0 -or ($uvicornProcs.Count -gt 2 -and -not $reloadPair)) {
    Write-Host ''
    Write-Host 'WARNING: ortiqcha uvicorn - pnpm dev:stop keyin bitta pnpm dev:api' -ForegroundColor Yellow
    foreach ($p in $orphanUvicorn) {
        Write-Host "  orphan PID $($p.ProcessId): $(Get-DevProcessCmd $p.ProcessId)" -ForegroundColor Yellow
    }
}

if ($fePids.Count -gt 1 -or $bePids.Count -gt 1) {
    Write-Host ''
    Write-Host 'WARNING: bir portda bir nechta listener - pnpm dev:stop' -ForegroundColor Yellow
    exit 1
}

if ($fePids.Count -eq 1 -and $bePids.Count -eq 1 -and $uvicornProcs.Count -le 2) { exit 0 }
if ($fePids.Count -le 1 -and $bePids.Count -le 1) { exit 0 }
exit 1
