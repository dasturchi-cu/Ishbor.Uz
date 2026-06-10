# Lighthouse CI — avval dev server ishlayotganini tekshiradi
$ErrorActionPreference = 'Stop'
$base = 'http://localhost:3000'

try {
  $r = Invoke-WebRequest -Uri $base -UseBasicParsing -TimeoutSec 8
  if ($r.StatusCode -ne 200) {
    Write-Host "Frontend javob bermadi ($base). Avval: pnpm dev:start" -ForegroundColor Red
    exit 1
  }
} catch {
  Write-Host "Frontend ishlamayapti ($base). Avval: pnpm dev:start" -ForegroundColor Red
  exit 1
}

Write-Host "Lighthouse: $base ..." -ForegroundColor Cyan
pnpm exec lhci autorun
exit $LASTEXITCODE
