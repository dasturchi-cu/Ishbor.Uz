# Backend dev server (default :8002, zombie bo'lsa 8003+)
$ErrorActionPreference = 'Continue'
. (Join-Path $PSScriptRoot 'lib\dev-lib.ps1')
Set-Location (Join-Path $Script:DevRoot 'backend')

$port = Resolve-DevBackendPort
Write-DevBackendPort -Port $port
$Script:DevBackendPort = $port
$Script:DevBackendHealthUrl = "http://127.0.0.1:$port/api/v1/health"
$apiUrl = Sync-DevFrontendApiUrl -Port $port
if ($port -ne 8002) {
    Write-Host "[dev-guard] NEXT_PUBLIC_API_URL -> $apiUrl (.env.local yangilandi)" -ForegroundColor Yellow
}

if (Test-DevBackendLiveAt -Port $port) {
    Write-Host "[dev-guard] Backend allaqachon ishlayapti - port $port" -ForegroundColor Yellow
    exit 0
}

if (-not (Test-Path '.venv\Scripts\python.exe')) {
    Write-Host 'ERROR: backend\.venv topilmadi' -ForegroundColor Red
    exit 1
}

Write-Host ''
Write-Host "[Backend :$port] API loglari shu yerda" -ForegroundColor Magenta
Write-Host "Health: $($Script:DevBackendHealthUrl)" -ForegroundColor DarkGray
Write-Host ''

# Windows + concurrently: --reload spawn WinError 5 (PermissionError)
$isWindows = ($env:OS -eq 'Windows_NT') -or ($IsWindows -eq $true)
$useReload = $false
if ($env:ISHBOR_RELOAD -eq '1') {
    $useReload = $true
} elseif (-not $isWindows -and $env:ISHBOR_DEV_ALL -ne '1') {
    $useReload = $true
}
if ($env:ISHBOR_DEV_ALL -eq '1' -and $isWindows) {
    Write-Host '[dev-guard] Windows dev:all - reload o''chirildi (WinError 5 oldini olish).' -ForegroundColor DarkGray
}
if ($isWindows -and $useReload) {
    Write-Host '[dev-guard] Windows da --reload o''chirildi (WinError 5 / crash oldini olish).' -ForegroundColor DarkGray
    $useReload = $false
}

$uvicornArgs = @('-m', 'uvicorn', 'app.main:app')
if ($useReload) {
    $uvicornArgs += @('--reload', '--reload-dir', 'app')
}
$uvicornArgs += @('--host', '127.0.0.1', '--port', "$port", '--access-log', '--log-level', 'info')

.\.venv\Scripts\python @uvicornArgs
