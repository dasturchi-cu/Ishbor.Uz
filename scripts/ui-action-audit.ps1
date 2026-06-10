# IshBor.uz - UI action / API ulanish audit
# Backend :8002 da ishlashi kerak. Frontend ixtiyoriy (sahifa testlari Playwright da).

$ErrorActionPreference = 'Continue'
. (Join-Path $PSScriptRoot 'lib\dev-lib.ps1')

$base = Get-DevApiBaseUrl
Assert-DevBackendReady -MaxWaitSec 25 -BaseUrl $base

$fail = 0
$warn = 0

function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Path,
        [int[]]$OkStatuses,
        [string]$Label,
        [object]$Body = $null
    )
    $uri = "$base$Path"
    try {
        $params = @{
            Uri         = $uri
            Method      = $Method
            TimeoutSec  = 15
            ErrorAction = 'Stop'
        }
        if ($Body) {
            $params.ContentType = 'application/json'
            $params.Body = ($Body | ConvertTo-Json -Compress)
        }
        $r = Invoke-WebRequest @params -UseBasicParsing
        $code = [int]$r.StatusCode
    }
    catch {
        if ($_.Exception.Response) {
            $code = [int]$_.Exception.Response.StatusCode.value__
        }
        else {
            Write-Host "FAIL $Method $Path - $($_.Exception.Message)" -ForegroundColor Red
            $script:fail++
            return
        }
    }
    if ($OkStatuses -contains $code) {
        Write-Host "OK $code $Method $Path - $Label" -ForegroundColor Green
    }
    else {
        Write-Host "FAIL $code $Method $Path - $Label (expected $($OkStatuses -join '/'))" -ForegroundColor Red
        $script:fail++
    }
}

Write-Host "UI action audit: $base" -ForegroundColor Cyan

# Public read
@(
    @('GET', '/api/v1/health', @(200), 'health'),
    @('GET', '/api/v1/health/ready', @(200), 'ready'),
    @('GET', '/api/v1/services?limit=1', @(200), 'services list'),
    @('GET', '/api/v1/projects?limit=1', @(200), 'projects list'),
    @('GET', '/api/v1/stats/public', @(200), 'landing stats'),
    @('GET', '/api/v1/vacancies', @(200), 'vacancies list'),
    @('GET', '/api/v1/companies', @(200), 'companies list'),
    @('GET', '/api/v1/profiles/freelancers?limit=1', @(200), 'freelancers'),
    @('GET', '/api/v1/platform/feature-flags', @(200), 'feature flags'),
    @('GET', '/api/v1/trust/buyer-protection', @(200), 'buyer protection')
) | ForEach-Object {
    Test-Endpoint -Method $_[0] -Path $_[1] -OkStatuses $_[2] -Label $_[3]
}

# Mutations without auth - 401 kutiladi (ulanish bor, lekin himoyalangan)
@(
    @('POST', '/api/v1/orders', 'create order'),
    @('POST', '/api/v1/saved-items/00000000-0000-0000-0000-000000000001', 'save service'),
    @('POST', '/api/v1/projects', 'create project'),
    @('POST', '/api/v1/applications', 'apply project'),
    @('POST', '/api/v1/reviews', 'create review'),
    @('POST', '/api/v1/messages', 'send message'),
    @('POST', '/api/v1/payments/withdrawals', 'withdraw'),
    @('PUT', '/api/v1/platform/drafts', 'save draft'),
    @('POST', '/api/v1/platform/reports', 'report user')
) | ForEach-Object {
    Test-Endpoint -Method $_[0] -Path $_[1] -OkStatuses @(401, 403, 422) -Label "$($_[2]) (auth required)"
}

# Public mutation - waitlist
$testEmail = "audit-$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
try {
    $wlBody = (@{ email = $testEmail; source = 'ui-action-audit' } | ConvertTo-Json -Compress)
    $wl = Invoke-WebRequest -Uri "$base/api/v1/waitlist" -Method POST -Body $wlBody -ContentType 'application/json' -UseBasicParsing -ErrorAction Stop
    $wlCode = [int]$wl.StatusCode
    if (@(200, 201, 204) -contains $wlCode) {
        Write-Host "OK $wlCode POST /api/v1/waitlist - waitlist signup" -ForegroundColor Green
    }
    else {
        Write-Host "WARN $wlCode POST /api/v1/waitlist - waitlist signup" -ForegroundColor Yellow
        $script:warn++
    }
}
catch {
    $wlCode = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode.value__ } else { 0 }
    if ($wlCode -eq 409) {
        Write-Host "OK 409 POST /api/v1/waitlist - waitlist duplicate" -ForegroundColor Green
    }
    elseif ($wlCode -eq 400 -or $wlCode -eq 503) {
        Write-Host "WARN $wlCode POST /api/v1/waitlist - DB migration kerak bo'lishi mumkin (pnpm db:push)" -ForegroundColor Yellow
        $script:warn++
    }
    else {
        Write-Host "FAIL $wlCode POST /api/v1/waitlist - waitlist signup" -ForegroundColor Red
        $script:fail++
    }
}

Write-Host ""
if ($fail -eq 0) {
    Write-Host "UI action audit PASSED ($warn warnings)" -ForegroundColor Green
    exit 0
}
Write-Host "UI action audit FAILED: $fail issue(s)" -ForegroundColor Red
exit 1
