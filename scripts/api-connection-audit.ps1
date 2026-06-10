# IshBor.uz — API ulanish audit (dev)
$Base = if ($env:NEXT_PUBLIC_API_URL) { $env:NEXT_PUBLIC_API_URL } else { 'http://127.0.0.1:8002' }
$paths = @(
  '/api/v1/health',
  '/api/v1/health/ready',
  '/api/v1/health/live',
  '/api/v1/services?limit=1',
  '/api/v1/projects?limit=1',
  '/api/v1/stats/public',
  '/api/v1/vacancies',
  '/api/v1/companies',
  '/api/v1/profiles/freelancers?limit=1',
  '/api/v1/trust/buyer-protection',
  '/api/v1/profiles/me',
  '/api/v1/dashboard/summary?role=client',
  '/api/v1/orders',
  '/api/v1/notifications',
  '/api/v1/messages/inbox',
  '/api/v1/admin/overview'
)

Write-Host "API audit: $Base"
$fail = 0
foreach ($p in $paths) {
  try {
    $r = Invoke-WebRequest -Uri "$Base$p" -TimeoutSec 25 -UseBasicParsing
    Write-Host ("OK {0} {1}" -f $r.StatusCode, $p)
  } catch {
    $status = $_.Exception.Response.StatusCode.value__
    if (-not $status) { $status = 'ERR' }
    $detail = $_.Exception.Message
    if ($status -eq 401 -or $status -eq 403) {
      Write-Host ("AUTH {0} {1} (expected without token)" -f $status, $p) -ForegroundColor Yellow
    } else {
      Write-Host ("FAIL {0} {1} {2}" -f $status, $p, $detail) -ForegroundColor Red
      $fail++
    }
  }
}
if ($fail -gt 0) { exit 1 }
Write-Host 'Public endpoints OK'
