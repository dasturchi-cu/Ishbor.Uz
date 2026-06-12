# Changelog

All notable changes to IshBor.uz are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- Comprehensive project documentation suite (`docs/`, root markdown files)
- Enterprise security migrations (`launch_security_p1_fixes`)
- Admin revenue charts and platform health panel
- Audit log CSV export
- Video call sessions from chat/contracts
- Backup checkpoint UI and cron job
- Chat attachment private bucket with signed URLs
- 2FA (TOTP), email change, session logout flows
- Profile slug and public username routing
- Referral program with bonus crediting
- Vacancies, companies, portfolio modules
- Service packages CRUD
- Search analytics and activity feed
- Notification deduplication
- Wallet top-up with polling
- Milestone escrow for contracts
- Fraud center and compliance flags
- Feature flags admin UI
- Telegram bot notification linking

### Changed

- Auth race conditions mitigated via `useAuthReady` / `useProtectedLoader`
- Backend `run_query` coverage ~95% on critical routers
- Profile RLS hardened — removed order-participant PII leak
- Orders table — client UPDATE policy removed (API-only status changes)
- Middleware profile cache to reduce Supabase reads

### Fixed

- Chat duplicate thread strategy (P0)
- Admin verification UI consolidation
- Hire flow, project status transitions, escrow auto-release
- Dashboard UX: breadcrumbs, forecast, mobile KPI, onboarding progress

### Security

- `participant_profiles` view restricted to service_role
- Financial tables deny direct client mutation
- Turnstile captcha on anonymous login audit
- Origin guard and rate limiting in production

---

## [0.1.0] — 2026-06-09

### Added

- **Frontend:** Next.js 16 App Router with 71+ routes
- **Architecture:** Clean Architecture refactor (`src/domain`, `application`, `infrastructure`, `presentation`)
- **i18n:** Uzbek (default), Russian, English
- **Auth:** Supabase Auth — email/password, Google OAuth, middleware protection
- **Backend:** FastAPI with 27 routers, ~150 endpoints at `/api/v1`
- **Database:** 66 Supabase migrations, 57+ tables, RLS on all business tables
- **Marketplace:** Services catalog, gig orders, project posting, proposals, contracts
- **Payments:** Escrow hold/release/refund (sandbox), wallet, Click/Payme integration (live-ready)
- **Chat:** REST API + Supabase Realtime subscribe
- **Reviews:** Post-completion ratings with freelancer replies
- **Admin:** User management, moderation, disputes, escrow, withdrawals, analytics
- **Trust:** Buyer protection, terms consent, reputation, bank accounts, receipts
- **SEO:** Metadata, sitemap, robots.txt, region landing pages
- **CI:** GitHub Actions — lint, build, Vitest, Playwright, pytest, CodeQL
- **Monitoring:** Sentry integration (frontend + backend)
- **Design system:** Figma tokens → `tokens.css`, primary `#2563EB`

### Known limitations

- Click/Payme live payments require merchant credentials
- Production deployment not yet completed
- Subscription billing (Pro/Business) not implemented
- `REQUIRE_EMAIL_VERIFIED` and `SESSION_IDLE_MINUTES` configured but not enforced in backend

---

## Version history summary

| Version | Date | Milestone |
|---------|------|-----------|
| 0.1.0 | 2026-06 | MVP core — marketplace, escrow sandbox, admin |
| Unreleased | 2026-06+ | Security hardening, P2 modules, production prep |

---

[Unreleased]: https://github.com/dasturchi-cu/Ishbor.Uz/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/dasturchi-cu/Ishbor.Uz/releases/tag/v0.1.0
