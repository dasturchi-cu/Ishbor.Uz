# Security Policy

## Reporting

Email: hello@ishbor.uz

Please include steps to reproduce, impact, and affected URLs.

## Supported versions

| Version | Supported |
|---------|-----------|
| main    | Yes       |

## Hardening checklist (repo)

- `.env` gitignored; CI uses placeholders only
- GitHub Actions secrets for deploy (`VERCEL_*`, `SUPABASE_*`)
- Dependabot enabled (`.github/dependabot.yml`)
- CodeQL analysis (`.github/workflows/codeql.yml`)
- Supabase RLS on all public tables
- Financial tables immutable (DB triggers)
- Turnstile CAPTCHA when `TURNSTILE_SECRET_KEY` is set
- Origin guard on mutating API requests (production)

## GitHub org (manual — not in repo)

1. **Branch protection** on `main`: require PR, status checks, no force push
2. **2FA required** for all org members
3. **Secret scanning** enabled (GitHub Advanced Security)

See [docs/security-production-setup.md](../docs/security-production-setup.md).
