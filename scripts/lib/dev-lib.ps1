# IshBor dev — umumiy yordamchi funksiyalar (port, jarayon, migration)
# Ishlatish: . (Join-Path $PSScriptRoot 'lib\dev-lib.ps1')

$Script:ScriptsRoot = Split-Path -Parent $PSScriptRoot
$Script:DevRoot = Split-Path -Parent $Script:ScriptsRoot
$Script:DevFrontendPort = 3000
$Script:DevBackendPort = 8002
$Script:DevBackendHealthUrl = "http://127.0.0.1:$($Script:DevBackendPort)/api/v1/health"

function Test-DevPortHasListener {
    param([int]$Port)
    return @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue).Count -gt 0
}

function Get-DevBackendPortFile {
    Join-Path $Script:DevRoot '.dev-backend-port'
}

function Read-DevBackendPort {
    $file = Get-DevBackendPortFile
    if (Test-Path $file) {
        try {
            $n = [int](Get-Content $file -Raw).Trim()
            if ($n -ge 8002 -and $n -le 8020) { return $n }
        } catch { }
    }
    return $Script:DevBackendPort
}

function Write-DevBackendPort {
    param([int]$Port)
    Set-Content -Path (Get-DevBackendPortFile) -Value $Port -NoNewline -Encoding utf8
}

function Sync-DevFrontendApiUrl {
    param([int]$Port = 0)
    if ($Port -le 0) { $Port = Read-DevBackendPort }
    $url = "http://127.0.0.1:$Port"
    $env:NEXT_PUBLIC_API_URL = $url

    $envLocal = Join-Path $Script:DevRoot '.env.local'
    if (Test-Path $envLocal) {
        $lines = Get-Content $envLocal -Encoding UTF8
        $found = $false
        $updated = foreach ($line in $lines) {
            if ($line -match '^\s*NEXT_PUBLIC_API_URL\s*=') {
                $found = $true
                "NEXT_PUBLIC_API_URL=$url"
            } else {
                $line
            }
        }
        if (-not $found) {
            $updated = @($updated) + "NEXT_PUBLIC_API_URL=$url"
        }
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($envLocal, ($updated -join "`n") + "`n", $utf8NoBom)
    }

    return $url
}

function Test-DevProcessDescendant {
    param(
        [int]$AncestorPid,
        [int]$DescendantPid,
        [int]$MaxDepth = 12
    )
    if ($AncestorPid -le 0 -or $DescendantPid -le 0) { return $false }
    if ($AncestorPid -eq $DescendantPid) { return $true }

    $current = $DescendantPid
    for ($i = 0; $i -lt $MaxDepth; $i++) {
        $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$current" -ErrorAction SilentlyContinue
        if (-not $proc) { return $false }
        $parent = [int]$proc.ParentProcessId
        if ($parent -eq $AncestorPid) { return $true }
        if ($parent -le 0) { return $false }
        $current = $parent
    }
    return $false
}

function Test-DevBackendPythonProcess {
    param($Process)
    $cmd = $Process.CommandLine
    if (-not $cmd) { return $false }

    $venvPattern = [regex]::Escape((Join-Path $Script:DevRoot 'backend\.venv'))
    if ($cmd -notmatch $venvPattern) { return $false }
    if ($cmd -match 'TestClient|httpx\.post|diag-timeout') { return $false }

    if ($cmd -match 'uvicorn' -and $cmd -match 'app\.main') { return $true }
    if ($cmd -match 'spawn_main|multiprocessing\.spawn') { return $true }
    return $false
}

function Get-DevUvicornProcesses {
    Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
        Where-Object {
            ($_.Name -eq 'python.exe' -or $_.Name -eq 'python3.exe') -and
            (Test-DevBackendPythonProcess $_)
        }
}

function Get-DevUvicornRootProcesses {
    $all = @(Get-DevUvicornProcesses)
    if ($all.Count -eq 0) { return @() }

    $pids = @($all | ForEach-Object { [int]$_.ProcessId })
    @($all | Where-Object { $pids -notcontains [int]$_.ParentProcessId })
}

function Stop-DevProcessTree {
    param([int]$ProcId)
    if ($ProcId -le 0) { return }
    if (-not (Get-Process -Id $ProcId -ErrorAction SilentlyContinue)) { return }
    try {
        & taskkill /T /F /PID $ProcId 2>$null | Out-Null
    } catch { }
    Stop-Process -Id $ProcId -Force -ErrorAction SilentlyContinue
}

function Test-DevUvicornOnPort {
    param([int]$Port)
    $portPattern = "--port\s+$Port\b"
    $uvicorn = @(Get-DevUvicornProcesses)
    foreach ($proc in $uvicorn) {
        if ($proc.CommandLine -match $portPattern) { return $true }
    }

    $uvicornPids = @($uvicorn | ForEach-Object { [int]$_.ProcessId })
    foreach ($listenerPid in (Get-DevPortListenerPids -Port $Port)) {
        if ($uvicornPids -contains $listenerPid) { return $true }
        foreach ($rootPid in $uvicornPids) {
            if (Test-DevProcessDescendant -AncestorPid $rootPid -DescendantPid $listenerPid) {
                return $true
            }
        }
    }
    return $false
}

function Test-DevBackendLiveAt {
    param(
        [int]$Port,
        [int]$TimeoutSec = 2
    )
    $base = "http://127.0.0.1:$Port"
    if (-not (Test-DevBackendHealthAt -BaseUrl $base -TimeoutSec $TimeoutSec)) { return $false }
    return (Test-DevUvicornOnPort -Port $Port)
}

function Get-DevBackendPortRange {
    8002..8010
}

function Resolve-DevBackendPort {
    $preferred = $Script:DevBackendPort
    $alive = Get-DevPortListenerPids -Port $preferred

    if ($alive.Count -gt 0) {
        if (Test-DevUvicornOnPort -Port $preferred) { return $preferred }
        Write-Host "[dev-guard] Port $preferred boshqa jarayon band - tozalash..." -ForegroundColor Yellow
        Stop-DevPortListener -Port $preferred
        Start-Sleep -Milliseconds 800
        if (-not (Test-DevPortHasListener -Port $preferred)) { return $preferred }
    } elseif (Test-DevPortZombie -Port $preferred) {
        Write-Host "[dev-guard] Port $preferred zombie listener - tozalash..." -ForegroundColor Yellow
        Repair-DevZombiePort -Port $preferred | Out-Null
        Start-Sleep -Milliseconds 800
        if (-not (Test-DevPortHasListener -Port $preferred)) { return $preferred }
    } elseif (-not (Test-DevPortHasListener -Port $preferred)) {
        return $preferred
    }

    Write-Host "[dev-guard] Port $preferred band - alternativ port..." -ForegroundColor Yellow
    foreach ($p in ($preferred + 1)..($preferred + 8)) {
        if (Test-DevPortZombie -Port $p) {
            Repair-DevZombiePort -Port $p | Out-Null
            Start-Sleep -Milliseconds 400
        }
        if (-not (Test-DevPortHasListener -Port $p)) {
            Write-Host "[dev-guard] Backend $p portida ishga tushadi." -ForegroundColor Yellow
            return $p
        }
    }
    Write-Host '[dev-guard] 8002-8010 band. pnpm dev:stop -> pnpm dev:all' -ForegroundColor Red
    exit 1
}

function Get-DevPortListenerPids {
    param([int]$Port)
    $pids = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
        ForEach-Object { $_.OwningProcess } |
        Sort-Object -Unique)
    # Windows: port band, lekin jarayon yo'q (zombie listener)
    $alive = @()
    foreach ($procId in $pids) {
        if (Get-Process -Id $procId -ErrorAction SilentlyContinue) {
            $alive += $procId
        }
    }
    return $alive
}

function Test-DevPortZombie {
    param([int]$Port)
    $all = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
        ForEach-Object { $_.OwningProcess } |
        Sort-Object -Unique)
    if ($all.Count -eq 0) { return $false }
    return (Get-DevPortListenerPids -Port $Port).Count -eq 0
}

function Test-DevPortInUse {
    param([int]$Port)
    (Get-DevPortListenerPids -Port $Port).Count -gt 0
}

function Show-DevPortGuard {
    param(
        [int]$Port,
        [string]$ServiceName
    )
    if (Test-DevPortZombie -Port $Port) {
        if (Repair-DevZombiePort -Port $Port) {
            if (-not (Test-DevPortZombie -Port $Port)) {
                if (-not (Test-DevPortInUse -Port $Port)) {
                    return $false
                }
            }
        }
        if (Test-DevPortZombie -Port $Port) {
            Write-Host "[dev-guard] $ServiceName port $Port zombie listener - jarayon yo'q." -ForegroundColor Red
            Write-Host '[dev-guard] Sinab ko''ring:' -ForegroundColor Yellow
            Write-Host '    pnpm dev:stop   (yana bir marta)' -ForegroundColor Yellow
            Write-Host '    pnpm dev:all    (faqat bitta terminal)' -ForegroundColor Yellow
            Write-Host '    taskkill /F /IM python.exe  (boshqa Python loyihalar yoq bolsa)' -ForegroundColor DarkGray
            Write-Host '    Oxirgi chora: Windows qayta yuklash' -ForegroundColor Yellow
            exit 1
        }
    }
    $pids = Get-DevPortListenerPids -Port $Port
    if ($pids.Count -eq 0) { return $false }

    Write-Host "[dev-guard] $ServiceName allaqachon ishlayapti - port $Port (PID: $($pids -join ', '))." -ForegroundColor Yellow
    Write-Host '[dev-guard] Yangi instance ochilmaydi. Qayta ishga tushirish: pnpm dev:stop' -ForegroundColor DarkGray
    return $true
}

function Get-DevProcessCmd {
    param([int]$ProcId)
    $p = Get-CimInstance Win32_Process -Filter "ProcessId=$ProcId" -ErrorAction SilentlyContinue
    if (-not $p -or -not $p.CommandLine) { return '?' }
    if ($p.CommandLine.Length -le 120) { return $p.CommandLine }
    return $p.CommandLine.Substring(0, 120) + '...'
}

function Stop-DevPortListener {
    param([int]$Port)
    # Zombie PID (jarayon yoq, port band) - netstat dagi barcha PID larni oldirish
    $allPids = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
        ForEach-Object { $_.OwningProcess } |
        Where-Object { $_ -gt 0 } |
        Sort-Object -Unique)
    foreach ($procId in $allPids) {
        Stop-DevProcessTree -ProcId $procId
    }
    foreach ($procId in (Get-DevPortListenerPids -Port $Port)) {
        Stop-DevProcessTree -ProcId $procId
    }
}

function Repair-DevZombiePort {
    param([int]$Port)

    Write-Host "[dev-guard] Port $Port zombie listener - tozalash..." -ForegroundColor Yellow

    Stop-DevBackendProcesses
    Stop-DevPortListener -Port $Port
    Start-Sleep -Seconds 2

    if (Test-DevPortZombie -Port $Port) {
        return $false
    }
    if (Test-DevPortInUse -Port $Port) {
        return $true
    }
    return $true
}

function Stop-DevNextProcesses {
    Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
        Where-Object {
            $cmd = $_.CommandLine
            $cmd -and ($cmd -match 'next dev' -or $cmd -match 'next\\dist\\bin\\next')
        } |
        ForEach-Object {
            Stop-DevProcessTree -ProcId $_.ProcessId
        }
}

function Stop-DevBackendProcesses {
    foreach ($proc in Get-DevUvicornRootProcesses) {
        Stop-DevProcessTree -ProcId $proc.ProcessId
    }
    Start-Sleep -Milliseconds 300
    foreach ($proc in Get-DevUvicornProcesses) {
        Stop-DevProcessTree -ProcId $proc.ProcessId
    }
}

function Test-DevShellWrapperProcess {
    param(
        $Process,
        [int]$ExcludePid = $PID
    )
    if ($Process.ProcessId -eq $ExcludePid) { return $false }
    $cmd = $Process.CommandLine
    if (-not $cmd) { return $false }

    # Prepare/stop/status/check scriptlarini o'ldirmaymiz (dev.ps1 shu yerga tushadi)
    if ($cmd -match 'dev\.ps1|dev-stop\.ps1|dev-status\.ps1|dev-check\.ps1') { return $false }

    if ($cmd -match 'dev-all\.ps1|dev-frontend\.ps1|dev-backend\.ps1') { return $true }
    if ($cmd -match 'concurrently' -and $cmd -match 'dev:api|pnpm dev') { return $true }
    if ($cmd -match 'pnpm dev:api') { return $true }
    if ($cmd -match 'pnpm dev' -and $cmd -notmatch 'dev:(start|stop|prepare|status|check|restart|clean)') {
        return $true
    }
    return $false
}

function Stop-DevShellWrappers {
    param([int]$ExcludePid = $PID)

    Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
        Where-Object { Test-DevShellWrapperProcess -Process $_ -ExcludePid $ExcludePid } |
        ForEach-Object {
            Stop-DevProcessTree -ProcId $_.ProcessId
        }
}

function Clear-DevNextLock {
    $lockPath = Join-Path $Script:DevRoot '.next\dev\lock'
    if (-not (Test-Path $lockPath)) { return }

    try {
        $raw = Get-Content $lockPath -Raw -ErrorAction Stop
        if ($raw) {
            $text = $raw.Trim()
            try {
                $info = $text | ConvertFrom-Json
                if ($null -ne $info.pid) {
                    Stop-DevProcessTree -ProcId ([int]$info.pid)
                }
            } catch {
                if ($text -match '^\d+$') {
                    Stop-DevProcessTree -ProcId ([int]$text)
                }
            }
        }
    } catch { }

    Remove-Item $lockPath -Force -ErrorAction SilentlyContinue
}

function Stop-AllDevServers {
    param(
        [switch]$Quiet,
        [int]$ExcludeShellPid = $PID
    )

    $pidsFile = Join-Path $Script:DevRoot '.dev-pids.json'
    if (Test-Path $pidsFile) {
        try {
            $info = Get-Content $pidsFile -Raw | ConvertFrom-Json
            foreach ($key in @('parent', 'backend', 'frontend')) {
                $procId = $info.$key
                if ($procId) {
                    Stop-DevProcessTree -ProcId ([int]$procId)
                }
            }
        } catch { }
        Remove-Item $pidsFile -Force -ErrorAction SilentlyContinue
    }

    if (-not $Quiet) {
        Write-Host 'Dev serverlar to''xtatilmoqda...' -ForegroundColor Cyan
    }

    Stop-DevShellWrappers -ExcludePid $ExcludeShellPid
    Stop-DevNextProcesses
    Stop-DevBackendProcesses

    $stopPorts = @($Script:DevFrontendPort, 3001) + @(Get-DevBackendPortRange)
    foreach ($port in $stopPorts) {
        Stop-DevPortListener -Port $port
    }

    Remove-Item (Get-DevBackendPortFile) -Force -ErrorAction SilentlyContinue

    Clear-DevNextLock
    Start-Sleep -Seconds 1

    Stop-DevNextProcesses
    Stop-DevBackendProcesses
    foreach ($port in $stopPorts) {
        Stop-DevPortListener -Port $port
    }
}

function Wait-DevBackendPortReady {
    param([int]$MaxWaitSec = 25)
    $deadline = [datetime]::UtcNow.AddSeconds($MaxWaitSec)
    while ([datetime]::UtcNow -lt $deadline) {
        if (Test-Path (Get-DevBackendPortFile)) {
            $filePort = Read-DevBackendPort
            if (Test-DevBackendLiveAt -Port $filePort -TimeoutSec 2) {
                Write-DevBackendPort -Port $filePort
                return $filePort
            }
        }
        foreach ($p in (Get-DevBackendPortRange)) {
            if (Test-DevBackendLiveAt -Port $p -TimeoutSec 1) {
                Write-DevBackendPort -Port $p
                return $p
            }
        }
        Start-Sleep -Milliseconds 400
    }
    $fallback = Read-DevBackendPort
    Write-DevBackendPort -Port $fallback
    return $fallback
}

function Get-DevApiBaseUrl {
    $port = Read-DevBackendPort
    $fromFile = "http://127.0.0.1:$port"
    $fromEnv = $env:NEXT_PUBLIC_API_URL
    if ($fromEnv -and $fromEnv.Trim()) {
        return $fromEnv.Trim().TrimEnd('/')
    }
    return $fromFile
}

function Get-DevFrontendUrl {
    return "http://127.0.0.1:$($Script:DevFrontendPort)"
}

function Test-DevBackendHealthAt {
    param(
        [string]$BaseUrl = (Get-DevApiBaseUrl),
        [int]$TimeoutSec = 4
    )
    try {
        $uri = "$($BaseUrl.TrimEnd('/'))/api/v1/health"
        $r = Invoke-WebRequest -Uri $uri -UseBasicParsing -TimeoutSec $TimeoutSec
        return $r.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Wait-DevBackendHealthAt {
    param(
        [string]$BaseUrl = (Get-DevApiBaseUrl),
        [int]$MaxWaitSec = 20,
        [int]$IntervalMs = 500,
        [int]$RequestTimeoutSec = 3
    )
    $deadline = [datetime]::UtcNow.AddSeconds($MaxWaitSec)
    while ([datetime]::UtcNow -lt $deadline) {
        if (Test-DevBackendHealthAt -BaseUrl $BaseUrl -TimeoutSec $RequestTimeoutSec) {
            return $true
        }
        Start-Sleep -Milliseconds $IntervalMs
    }
    return $false
}

function Test-DevBackendHealth {
    param([int]$TimeoutSec = 4)
    return Test-DevBackendHealthAt -TimeoutSec $TimeoutSec
}

function Wait-DevBackendHealth {
    param(
        [int]$MaxWaitSec = 20,
        [int]$IntervalMs = 500,
        [int]$RequestTimeoutSec = 3
    )
    return Wait-DevBackendHealthAt -MaxWaitSec $MaxWaitSec -IntervalMs $IntervalMs -RequestTimeoutSec $RequestTimeoutSec
}

function Test-DevFrontendHealth {
    param(
        [string]$WebUrl = (Get-DevFrontendUrl),
        [int]$TimeoutSec = 4
    )
    try {
        $r = Invoke-WebRequest -Uri $WebUrl -UseBasicParsing -TimeoutSec $TimeoutSec
        return $r.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Wait-DevFrontendHealth {
    param(
        [string]$WebUrl = (Get-DevFrontendUrl),
        [int]$MaxWaitSec = 20,
        [int]$IntervalMs = 500,
        [int]$RequestTimeoutSec = 3
    )
    $deadline = [datetime]::UtcNow.AddSeconds($MaxWaitSec)
    while ([datetime]::UtcNow -lt $deadline) {
        if (Test-DevFrontendHealth -WebUrl $WebUrl -TimeoutSec $RequestTimeoutSec) {
            return $true
        }
        Start-Sleep -Milliseconds $IntervalMs
    }
    return $false
}

function Show-DevBackendStartupHint {
    param([int]$MaxWaitSec = 20)
    $port = Read-DevBackendPort
    $base = "http://127.0.0.1:$port"
    $healthUrl = "$base/api/v1/health"
    Write-Host ''
    Write-Host 'Backend tekshirilmoqda - dev:all bilan 5-15s kutish mumkin...' -ForegroundColor DarkGray
    $deadline = [datetime]::UtcNow.AddSeconds($MaxWaitSec)
    $live = $false
    while ([datetime]::UtcNow -lt $deadline) {
        if (Test-DevBackendLiveAt -Port $port -TimeoutSec 2) {
            $live = $true
            break
        }
        Start-Sleep -Milliseconds 500
    }
    if ($live) {
        Write-Host "Backend health OK ($healthUrl)" -ForegroundColor Green
        return
    }
    if (Test-DevBackendHealthAt -BaseUrl $base -TimeoutSec 2) {
        Write-Host ''
        Write-Host "Port $port javob berdi, lekin uvicorn ishlamayapti (zombie port)." -ForegroundColor Red
        Write-Host '    pnpm dev:stop -> pnpm dev:all' -ForegroundColor Yellow
        Write-Host ''
        return
    }
    if (Test-DevPortInUse -Port $port) {
        Write-Host ''
        Write-Host "Backend port $port band, lekin /health javob bermadi." -ForegroundColor Yellow
        Write-Host '    Bir necha soniya kuting yoki: pnpm dev:stop -> pnpm dev:all' -ForegroundColor Yellow
        Write-Host ''
        return
    }
    Write-Host ''
    Write-Host "!!! BACKEND ISHLAMAYAPTI (port $port) !!!" -ForegroundColor Red
    Write-Host '    Alohida terminal: pnpm dev:api' -ForegroundColor Yellow
    Write-Host '    yoki: pnpm dev:all (ikkala server birga)' -ForegroundColor Yellow
    Write-Host '    Aks holda 408 timeout xatolari chiqadi.' -ForegroundColor Yellow
    Write-Host ''
}

function Assert-DevBackendReady {
    param(
        [int]$MaxWaitSec = 25,
        [string]$BaseUrl = (Get-DevApiBaseUrl)
    )
    Write-Host "Backend kutilmoqda ($BaseUrl / max ${MaxWaitSec}s)..." -ForegroundColor DarkGray
    if (Wait-DevBackendHealthAt -BaseUrl $BaseUrl -MaxWaitSec $MaxWaitSec) {
        Write-Host 'Backend health OK' -ForegroundColor Green
        return
    }
    Write-Host ''
    Write-Host 'Backend ishlamayapti.' -ForegroundColor Red
    Write-Host '  pnpm dev:api   yoki   pnpm dev:all' -ForegroundColor Yellow
    Write-Host '  pnpm dev:status' -ForegroundColor Yellow
    exit 1
}

function Assert-DevFrontendReady {
    param(
        [int]$MaxWaitSec = 25,
        [string]$WebUrl = (Get-DevFrontendUrl)
    )
    Write-Host "Frontend kutilmoqda ($WebUrl / max ${MaxWaitSec}s)..." -ForegroundColor DarkGray
    if (Wait-DevFrontendHealth -WebUrl $WebUrl -MaxWaitSec $MaxWaitSec) {
        Write-Host 'Frontend OK' -ForegroundColor Green
        return
    }
    Write-Host ''
    Write-Host 'Frontend ishlamayapti.' -ForegroundColor Red
    Write-Host '  pnpm dev   yoki   pnpm dev:all' -ForegroundColor Yellow
    Write-Host '  pnpm dev:status' -ForegroundColor Yellow
    exit 1
}

function Invoke-DevSubScript {
    param(
        [Parameter(Mandatory)][string]$Name,
        [object[]]$ArgumentList = @()
    )
    $path = Join-Path $Script:ScriptsRoot $Name
    if (-not (Test-Path $path)) {
        Write-Host "ERROR: script topilmadi - $path" -ForegroundColor Red
        exit 1
    }
    & $path @ArgumentList
    return $LASTEXITCODE
}

function Sync-DevSupabaseMigrations {
    if ($env:SUPABASE_SKIP_DB_PUSH -eq '1') {
        Write-Host 'Supabase: db push o''tkazildi (SUPABASE_SKIP_DB_PUSH=1)' -ForegroundColor Yellow
        return
    }

    if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
        Write-Host 'Supabase CLI topilmadi - db push o''tkazildi' -ForegroundColor Yellow
        return
    }

    Set-Location $Script:DevRoot
    if (-not (Test-Path 'supabase\migrations')) {
        Write-Host 'supabase/migrations yo''q - db push o''tkazildi' -ForegroundColor Yellow
        return
    }

    Write-Host 'Supabase: migratsiyalar tekshirilmoqda...' -ForegroundColor Cyan
    $listOut = supabase migration list --linked 2>&1 | Out-String

    if ($LASTEXITCODE -ne 0) {
        Write-Host 'Supabase ulanmagan - db push o''tkazildi (supabase link --project-ref REF)' -ForegroundColor Yellow
        return
    }

    $hasPending = $false
    foreach ($line in ($listOut -split "`n")) {
        if ($line -match "^\s+(\d{14,})\s+\|\s+\|\s+") {
            $hasPending = $true
            break
        }
    }

    if (-not $hasPending) {
        Write-Host 'Supabase: bazada yangi migratsiya yo''q' -ForegroundColor Green
        return
    }

    Write-Host 'Supabase: pending migratsiyalar - db push...' -ForegroundColor Cyan
    $pushOut = supabase db push --linked --yes 2>&1 | Out-String
    $pushOut | Out-Host

    if ($LASTEXITCODE -ne 0) {
        if ($pushOut -match 'schema_migrations_pkey|duplicate key value violates unique constraint') {
            Write-Host 'Supabase: migratsiya versiyasi remote da bor (duplicate key).' -ForegroundColor Yellow
            Write-Host '  Fix: supabase migration repair --status applied VERSION' -ForegroundColor Yellow
            return
        }
        Write-Host 'Supabase db push xato - dev to''xtatildi' -ForegroundColor Red
        exit 1
    }

    Write-Host 'Supabase: migratsiyalar qo''llandi' -ForegroundColor Green
}
