# Lighthouse CI — avval dev server ishlayotganini tekshiradi
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'lib\dev-lib.ps1')

$base = Get-DevFrontendUrl
Assert-DevFrontendReady -MaxWaitSec 25 -WebUrl $base

Write-Host "Lighthouse: $base ..." -ForegroundColor Cyan
pnpm exec lhci autorun
exit $LASTEXITCODE
