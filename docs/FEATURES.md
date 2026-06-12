# Features

Complete feature inventory for IshBor.uz with implementation status.

**Last updated:** 2026-06-12  
**Overall MVP progress:** ~75–80%  
**Legend:** ✅ Implemented · ⚠️ Partial · 📋 Planned · ❌ Not started · 🔒 Blocked (external dependency)

---

## Summary

| Category | Implemented | Partial | Planned | Total |
|----------|:-----------:|:-------:|:-------:|:-----:|
| Core platform | 12 | 2 | 1 | 15 |
| Auth & profile | 10 | 3 | 4 | 17 |
| Gig marketplace | 8 | 1 | 1 | 10 |
| Project marketplace | 7 | 1 | 1 | 9 |
| Payments & escrow | 9 | 2 | 0 | 11 |
| Communication | 5 | 1 | 2 | 8 |
| Reviews & trust | 6 | 1 | 2 | 9 |
| Admin | 12 | 2 | 2 | 16 |
| Growth & SEO | 6 | 3 | 5 | 14 |
| Monetization | 1 | 0 | 4 | 5 |
| **Total** | **76** | **16** | **22** | **114** |

---

## 1. Core platform

| Feature | Status | Notes |
|---------|--------|-------|
| Next.js 16 App Router | ✅ | `/login`, `/services`, `/dashboard`, etc. |
| Clean Architecture (`src/`) | ✅ | domain → application → infrastructure → presentation |
| i18n (uz/ru/en) | ✅ | `src/infrastructure/i18n/` |
| 14 Uzbekistan regions | ✅ | `src/domain/constants/regions.ts` |
| Design system (Tailwind 4 + shadcn) | ✅ | Primary `#2563EB` |
| Dark/light theme | ✅ | AppProvider |
| Responsive layout (375px+) | ✅ | Mobile-first |
| SEO (metadata, sitemap, robots) | ✅ | Dynamic sitemap for services, freelancers, projects |
| Terms of Service | ✅ | `/terms` |
| Privacy Policy | ✅ | `/privacy` |
| Error monitoring (Sentry) | ⚠️ | Integrated; production DSN pending |
| Production deployment | 📋 | Vercel + Railway + Supabase prod |
| CI/CD (GitHub Actions) | ⚠️ | Lint + build; deploy pipeline partial |

---

## 2. Authentication & profile

| Feature | Status | Notes |
|---------|--------|-------|
| Email/password registration | ✅ | Supabase Auth |
| Login / logout | ✅ | Session cookies + JWT |
| Password reset | ✅ | Supabase flow |
| Middleware route protection | ✅ | `proxy.ts` + AuthGuard |
| Role: freelancer / client | ✅ | Switchable via API |
| Profile CRUD | ✅ | Name, bio, region, skills, avatar |
| Avatar upload | ✅ | Supabase Storage |
| Public profile slug | ✅ | `/freelancer/[slug]` |
| 2FA (TOTP) | ✅ | Enable/disable in settings |
| Email change flow | ✅ | Verified update |
| Session management | ✅ | Logout all sessions |
| OAuth (Google, Telegram) | 📋 | Post-launch |
| Phone OTP login | 🔒 | Requires SMS provider setup |
| KYC document upload | ✅ | Identity verification flow |
| Portfolio gallery | ✅ | Work samples on profile |
| CV builder | ⚠️ | UI exists; DB persist partial |
| UI preferences | ✅ | Theme, language persistence |

---

## 3. Gig marketplace (Kwork-style)

| Feature | Status | Notes |
|---------|--------|-------|
| Service creation | ✅ | `/services/create` |
| Service catalog | ✅ | `/services` with filters |
| Service detail page | ✅ | Packages, reviews, order CTA |
| Service packages (tiers) | ✅ | Basic/Standard/Premium CRUD |
| Category filtering | ✅ | By category, price, region, rating |
| Freelancer public profile | ✅ | `/freelancer/[id]` |
| Order creation | ✅ | From service with requirements |
| Order status machine | ✅ | pending → active → delivered → completed |
| Order revision flow | ✅ | Client requests rework |
| Service moderation | ✅ | Admin approval for edits |
| Saved services | ✅ | Bookmark API |
| Featured listings | 📋 | Paid promotion — post-launch |

---

## 4. Project marketplace (Upwork-style)

| Feature | Status | Notes |
|---------|--------|-------|
| Project posting | ✅ | `/post-project` |
| Project catalog | ✅ | `/projects` with filters |
| Proposal submission | ✅ | Cover letter + bid |
| Proposal management | ✅ | Shortlist, reject, hire |
| Contract creation | ✅ | Auto on hire |
| Contract milestones | ✅ | Phased escrow funding |
| Milestone status actions | ✅ | Fund, submit, approve, release |
| Project status machine | ✅ | draft → open → active → completed |
| Contract chat | ✅ | Linked to contract entity |
| AI project description | 📋 | Claude API — future |

---

## 5. Payments & escrow

| Feature | Status | Notes |
|---------|--------|-------|
| Escrow hold | ✅ | Double-entry ledger RPC |
| Escrow release | ✅ | 90% to freelancer on completion |
| Escrow refund | ✅ | On dispute resolution / cancel |
| Platform commission (10%) | ✅ | Deducted on release |
| Wallet balance | ✅ | `profiles.wallet_balance` |
| Wallet top-up (sandbox) | ✅ | `POST /payments/wallet/topup` |
| Pay from wallet | ✅ | `POST /pay-wallet` |
| Withdrawal requests | ✅ | Manual admin approval |
| Auto-release (3 days) | ✅ | Cron job after delivery |
| Click integration | ⚠️ | Code ready; 🔒 live merchant credentials |
| Payme integration | ⚠️ | Code ready; 🔒 live merchant credentials |

---

## 6. Communication

| Feature | Status | Notes |
|---------|--------|-------|
| Order/contract chat | ✅ | REST send + Realtime receive |
| Inbox (thread list) | ✅ | Batched `GET /messages/inbox` |
| File attachments | ✅ | Private bucket, order-scoped |
| In-app notifications | ✅ | Realtime badge counts |
| Email notifications | ✅ | Resend API |
| SMS notifications | ⚠️ | Eskiz.uz integrated; production config pending |
| Telegram bot | 📋 | Notification channel — growth phase |
| Video call | ✅ | WebRTC test feature from chat |
| Push notifications (Web Push) | 📋 | Post-launch |

---

## 7. Reviews & trust

| Feature | Status | Notes |
|---------|--------|-------|
| Post-order reviews | ✅ | 1–5 stars + text |
| Freelancer average rating | ✅ | Displayed on profile and cards |
| Review reply | ✅ | Freelancer can respond |
| Trust score / reputation badge | ✅ | Calculated trust_score |
| Fraud message scanning | ✅ | `fraud_service` flags |
| User reports | ✅ | Report modal + admin queue |
| Dispute system | ✅ | Open, respond, admin resolve |
| Dispute SLA checker | ✅ | Cron escalation |
| Skill tests / certification | 📋 | Future supply quality feature |
| Two-sided reviews | 📋 | Client reviews — future |

---

## 8. Admin panel

| Feature | Status | Notes |
|---------|--------|-------|
| Admin dashboard | ✅ | `/admin` (requires `is_admin`) |
| User management | ✅ | List, search, suspend |
| Order monitoring | ✅ | Status overview |
| Escrow overview | ✅ | Held funds dashboard |
| Dispute resolution | ✅ | Resolve client/freelancer/return |
| Withdrawal approval | ✅ | Finance tab |
| Verification queue | ✅ | Identity, freelancer, company, bank |
| Service moderation | ✅ | Approve/reject edits |
| Fraud alert dashboard | ✅ | Moderation panel |
| Feature flags | ✅ | `/admin/feature-flags` |
| Revenue charts | ✅ | Commission analytics over time |
| Platform health panel | ✅ | `/health/ready` integration |
| Audit log CSV export | ✅ | Downloadable |
| Backup checkpoint UI | ✅ | Metadata recording |
| User impersonation (support) | 📋 | Planned for support role |
| KYC document viewer | ✅ | Admin verification queue |

---

## 9. Growth & SEO

| Feature | Status | Notes |
|---------|--------|-------|
| Referral program (50k UZS) | ⚠️ | Backend ✅; dashboard widget partial |
| Vacancies (job board) | ✅ | `/vacancies` |
| Companies module | ✅ | Company profiles + hiring |
| Activity feed | ✅ | Dashboard activity stream |
| Search analytics | ✅ | `analytics_events` tracking |
| Dynamic sitemap | ✅ | Services, freelancers, projects, companies |
| Structured data (JSON-LD) | ⚠️ | Organization schema; per-page partial |
| Region SEO landing pages | 📋 | `/regions/[slug]` — planned |
| Blog / CMS | 📋 | Static content now |
| Help center (DB-backed) | 📋 | Static FAQ now |
| Landing A/B testing | 📋 | Post-launch optimization |
| OG images per service | 📋 | Dynamic social cards |

---

## 10. Monetization

| Feature | Status | Notes |
|---------|--------|-------|
| Transaction commission (10%) | ✅ | Active on all releases |
| Pro subscription (~99k UZS/mo) | 📋 | Lower commission, priority support |
| Business subscription (~499k UZS/mo) | 📋 | Team features, analytics |
| Featured listing (~50k UZS/wk) | 📋 | Promoted placement |
| Advertising (sponsored) | 📋 | Scale phase |

---

## 11. Dashboard & UX

| Feature | Status | Notes |
|---------|--------|-------|
| Freelancer dashboard | ✅ | Orders, services, earnings |
| Client dashboard | ✅ | Orders, projects, spending |
| Onboarding progress | ✅ | Hero progress indicator |
| Breadcrumbs | ✅ | Dashboard navigation |
| Empty states | ✅ | `EmptyState` component |
| Loading skeletons | ⚠️ | `LoadingBlock` on key pages |
| Mobile KPI cards | ✅ | 375px responsive |
| Earnings forecast | ✅ | Freelancer dashboard widget |
| Client spending analytics | ⚠️ | Basic stats; detailed charts partial |
| Keyboard navigation (admin) | ⚠️ | ⌘K command palette |

---

## 12. Enterprise & security

| Feature | Status | Notes |
|---------|--------|-------|
| Row Level Security (RLS) | ✅ | All core tables |
| Rate limiting | ✅ | IP/user buckets |
| CORS production config | ⚠️ | Code ready; env verification needed |
| Idempotency keys | ✅ | Payment mutations |
| Immutable financial ledger | ✅ | DB triggers |
| Audit logs | ✅ | Admin actions recorded |
| Cloudflare Turnstile | ✅ | Bot protection on forms |
| Enterprise security migration | ⚠️ | `pnpm db:push` pending for latest migrations |
| Compliance flags | ✅ | Admin resolve UI |

---

## 13. Testing

| Feature | Status | Notes |
|---------|--------|-------|
| Backend pytest | ✅ | Orders, payments, transitions |
| E2E Playwright | ✅ | Wallet, milestones, admin, verification |
| TypeScript strict check | ✅ | `tsc --noEmit` passes |
| Production build | ✅ | `pnpm build` passes |

---

## 14. Pre-launch blockers

| Blocker | Status | Owner action |
|---------|--------|--------------|
| Click/Payme live credentials | 🔒 | Apply for merchant accounts |
| Production deployment | 📋 | Vercel + Railway + Supabase prod |
| Enterprise DB migrations push | ⚠️ | Run `pnpm db:push` |
| Sentry production DSN | ⚠️ | Configure env vars |

---

## 15. Related documents

| Document | Purpose |
|----------|---------|
| [plan-status.md](../plan-status.md) | Live implementation status |
| [production-backlog.md](./production-backlog.md) | 100-task production checklist |
| [actionable-backlog.md](./actionable-backlog.md) | Current sprint tasks |
| [PRODUCT_REQUIREMENTS.md](./PRODUCT_REQUIREMENTS.md) | MVP scope IN/OUT |
| [ROADMAP.md](./ROADMAP.md) | Future phases |

---

*Status reflects codebase as of 2026-06-12. Update this document at each milestone or sprint completion.*
