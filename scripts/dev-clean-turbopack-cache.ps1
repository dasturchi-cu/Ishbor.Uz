# Turbopack dev cache tozalash — uzoq dev sessiyada 10–20GB o'sishi mumkin (node.exe RAM + disk).
param(
  [double]$MaxSizeGB = 2,
  [switch]$Force
)

$ErrorActionPreference = 'Continue'
$Root = Split-Path -Parent $PSScriptRoot
$cacheDir = Join-Path $Root '.next\dev\cache\turbopack'

if (-not (Test-Path $cacheDir)) {
  Write-Host '[dev-clean] turbopack cache yo''q — skip' -ForegroundColor DarkGray
  exit 0
}

$sizeBytes = (Get-ChildItem $cacheDir -Recurse -File -ErrorAction SilentlyContinue |
  Measure-Object -Property Length -Sum).Sum
$sizeGB = if ($sizeBytes) { [math]::Round($sizeBytes / 1GB, 2) } else { 0 }

if (-not $Force -and $sizeGB -lt $MaxSizeGB) {
  Write-Host "[dev-clean] turbopack cache OK ($sizeGB GB < $MaxSizeGB GB)" -ForegroundColor DarkGray
  exit 0
}

$nextLock = Join-Path $Root '.next\dev\lock'
if ((Test-Path $nextLock) -and -not $Force) {
  Write-Host '[dev-clean] next dev ishlayapti — cache tozalash o''tkazildi (pnpm dev:stop keyin qayta urinib ko''ring)' -ForegroundColor Yellow
  exit 0
}

Write-Host "[dev-clean] turbopack cache tozalanmoqda ($sizeGB GB)..." -ForegroundColor Yellow
Remove-Item $cacheDir -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $cacheDir -Force | Out-Null

$afterBytes = (Get-ChildItem $cacheDir -Recurse -File -ErrorAction SilentlyContinue |
  Measure-Object -Property Length -Sum).Sum
$afterGB = if ($afterBytes) { [math]::Round($afterBytes / 1GB, 2) } else { 0 }
Write-Host "[dev-clean] turbopack cache tozalandi ($afterGB GB qoldi)" -ForegroundColor Green
