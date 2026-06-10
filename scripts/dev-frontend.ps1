# Frontend dev server (:3000)
$ErrorActionPreference = 'Continue'
. (Join-Path $PSScriptRoot 'lib\dev-lib.ps1')
Set-Location $Script:DevRoot

if (Show-DevPortGuard -Port $Script:DevFrontendPort -ServiceName 'Frontend') { exit 0 }

Invoke-DevSubScript -Name 'dev-clean-turbopack-cache.ps1' -ArgumentList 2 | Out-Null

Write-Host ''
Write-Host '[Frontend :3000] Sahifa loglari shu yerda' -ForegroundColor Cyan
Write-Host 'Backend port kutilmoqda (dev:all race)...' -ForegroundColor DarkGray
$backendPort = Wait-DevBackendPortReady -MaxWaitSec 25
$apiUrl = Sync-DevFrontendApiUrl -Port $backendPort
Write-Host "[Backend  :$backendPort] API: $apiUrl" -ForegroundColor DarkGray
Write-Host 'Brauzer: http://localhost:3000' -ForegroundColor Green

Show-DevBackendStartupHint

Write-Host ''
pnpm exec next dev --turbopack -p $Script:DevFrontendPort
