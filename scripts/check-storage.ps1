# Supabase storage bucketlari (service role orqali - anon/publishable ro'yxat bermaydi)
$ErrorActionPreference = 'Continue'
$Root = Split-Path -Parent $PSScriptRoot

function Read-EnvValue($file, $key) {
  if (-not (Test-Path $file)) { return $null }
  $line = Get-Content $file | Where-Object { $_ -match "^$key=" } | Select-Object -First 1
  if (-not $line) { return $null }
  return ($line -replace "^$key=", '').Trim()
}

$url = Read-EnvValue (Join-Path $Root 'backend\.env') 'SUPABASE_URL'
if (-not $url) { $url = Read-EnvValue (Join-Path $Root '.env.local') 'NEXT_PUBLIC_SUPABASE_URL' }
$svc = Read-EnvValue (Join-Path $Root 'backend\.env') 'SUPABASE_SERVICE_ROLE_KEY'

if (-not $url -or -not $svc) {
  Write-Host 'ERROR: SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY kerak (backend/.env)' -ForegroundColor Red
  exit 1
}

try {
  $r = Invoke-WebRequest -Uri "$url/storage/v1/bucket" -Headers @{
    apikey        = $svc
    Authorization = "Bearer $svc"
  } -UseBasicParsing -TimeoutSec 20
  $buckets = $r.Content | ConvertFrom-Json
  Write-Host "Storage buckets ($($buckets.Count)):" -ForegroundColor Cyan
  foreach ($b in $buckets) {
    Write-Host ("  - {0} (public={1})" -f $b.id, $b.public)
  }
  $required = @('avatars', 'service-media', 'project-attachments')
  $missing = $required | Where-Object { $buckets.id -notcontains $_ }
  if ($missing.Count -gt 0) {
    Write-Host ("MISSING: {0} - run pnpm db:push" -f ($missing -join ', ')) -ForegroundColor Red
    exit 1
  }
  Write-Host 'Storage OK' -ForegroundColor Green
} catch {
  Write-Host ("Storage check FAILED: {0}" -f $_.Exception.Message) -ForegroundColor Red
  exit 1
}
