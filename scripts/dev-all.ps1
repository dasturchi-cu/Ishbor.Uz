# dev:all — concurrently + Windows reload muammosini oldini oladi
$ErrorActionPreference = 'Continue'
$env:ISHBOR_DEV_ALL = '1'
Set-Location (Split-Path -Parent $PSScriptRoot)

pnpm exec concurrently -n backend,frontend -c magenta,cyan 'pnpm dev:api' 'pnpm dev'
