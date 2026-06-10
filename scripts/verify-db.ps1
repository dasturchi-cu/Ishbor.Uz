# DB migration / RLS tekshiruvi — backend health/ready orqali
$ErrorActionPreference = "Stop"
. "$PSScriptRoot\lib\dev-lib.ps1"

$port = Resolve-DevBackendPort
$base = "http://127.0.0.1:$port/api/v1/health/ready"

Write-Host "Checking $base ..."
try {
    $resp = Invoke-RestMethod -Uri $base -TimeoutSec 15
} catch {
    Write-Host "FAIL: backend not reachable on port $port" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

Write-Host "Status: $($resp.status)"
Write-Host "Database: $($resp.database)"

if ($resp.migrations) {
    $resp.migrations | ConvertTo-Json -Depth 6 | Write-Host
}

if ($resp.status -ne "ready") {
    Write-Host "FAIL: migrations not ready — run: pnpm db:push" -ForegroundColor Red
    exit 1
}

Write-Host "OK: launch migrations verified" -ForegroundColor Green
exit 0
