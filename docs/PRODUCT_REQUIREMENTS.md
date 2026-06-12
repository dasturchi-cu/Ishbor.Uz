# Product Requirements Document (PRD)

**Product:** IshBor.uz  
**Version:** 1.0  
**Last updated:** 2026-06-12  
**Status:** MVP ~75–80% complete (sandbox payments; live Click/Payme pending)

---

## 1. Executive summary

IshBor.uz is Uzbekistan's freelance marketplace — a local alternative to Kwork, Upwork, and Fiverr. The platform connects clients (small businesses, startups, individuals) with verified freelancers across 14 regions of Uzbekistan.

**Core value proposition:**

- Freelancers publish services and earn income with transparent 10% commission
- Clients find specialists quickly with escrow-protected payments
- All transactions use Uzbek so'm (UZS) via Click and Payme

**Target launch:** Public beta after live payment integration and production deployment.

---

## 2. Product vision & goals

### Vision

Become the default freelance marketplace for Uzbekistan and, eventually, Central Asia — trusted, local-language-first, and payment-native.

### Strategic goals (12 months)

| Goal | Metric | Target |
|------|--------|--------|
| User acquisition | Registered users | 2,000+ |
| Supply | Active freelancers | 200+ |
| Demand | Completed orders | 150+ |
| Revenue | GMV (gross merchandise value) | 75M+ UZS/month |
| Trust | Dispute rate | < 5% of orders |
| Retention | 30-day return rate | > 25% |

### MVP success criteria

| Metric | 1-month target |
|--------|----------------|
| Registered users | 200+ |
| Active freelancers | 50+ |
| Orders created | 30+ |
| Successful payments | 20+ |
| Average order value | 500,000+ UZS |

---

## 3. Target users & personas

### Persona 1: Dilshod — Freelancer (Web Developer)

| Attribute | Detail |
|-----------|--------|
| Age | 24–32 |
| Location | Tashkent |
| Goal | Earn stable income from local and remote clients |
| Pain points | Telegram/OLX deals lack escrow; Upwork payouts are hard in UZ |
| IshBor needs | Service listings, order inbox, wallet, reviews, low commission |
| Success moment | First completed order with funds released to wallet |

### Persona 2: Madina — Small Business Owner (Client)

| Attribute | Detail |
|-----------|--------|
| Age | 28–45 |
| Location | Samarkand |
| Goal | Hire a designer/developer for a one-off project |
| Pain points | No trust in upfront payments; hard to compare freelancers |
| IshBor needs | Service catalog, escrow checkout, chat, dispute protection |
| Success moment | Delivered work approved; payment released only after acceptance |

### Persona 3: Jasur — Startup Founder (Project Client)

| Attribute | Detail |
|-----------|--------|
| Age | 26–38 |
| Location | Tashkent |
| Goal | Hire a team member for a 2–4 week MVP build |
| Pain points | Needs proposals, milestones, and contract-style workflow |
| IshBor needs | Project posting, proposals, contracts, milestone escrow |
| Success moment | Milestone approved; freelancer paid per phase |

### Persona 4: Admin — Platform Operator

| Attribute | Detail |
|-----------|--------|
| Role | Moderator / support / finance |
| Goal | Keep marketplace safe and financially accurate |
| Needs | Dispute resolution, withdrawal approval, fraud alerts, audit logs |

---

## 4. Product scope

### 4.1 Dual marketplace model

IshBor supports two hiring flows on one platform:

| Flow | Style | Path |
|------|-------|------|
| **Gig** | Kwork/Fiverr | Service → Order → Escrow → Delivery → Review |
| **Project** | Upwork | Project → Proposal → Contract → Milestones → Review |

Both flows share: escrow, chat, disputes, wallet, notifications, and reviews.

### 4.2 MVP scope — IN

Features required for public beta launch.

#### Infrastructure

| Feature | Description | Status |
|---------|-------------|--------|
| App Router URLs | `/login`, `/services`, `/dashboard`, etc. | ✅ Implemented |
| PostgreSQL + Supabase | Managed DB with RLS | ✅ Implemented |
| FastAPI backend | Business logic, 27 domain routers | ✅ Implemented |
| Supabase Auth | Register, login, session, middleware | ✅ Implemented |
| File upload | Avatars, chat attachments (Supabase Storage) | ✅ Implemented |
| i18n | Uzbek (default), Russian, English | ✅ Implemented |
| SEO | Metadata, sitemap, robots.txt | ✅ Implemented |
| Terms & Privacy | `/terms`, `/privacy` | ✅ Implemented |

#### User & profile

| Feature | Description | Status |
|---------|-------------|--------|
| Roles | Freelancer / client (switchable) | ✅ Implemented |
| Profile CRUD | Name, bio, region, skills, avatar | ✅ Implemented |
| 14 regions | All Uzbekistan regions + Tashkent city | ✅ Implemented |
| Verification | Identity, freelancer, company, bank | ✅ Implemented |
| 2FA | TOTP two-factor authentication | ✅ Implemented |
| Email change | Verified email update flow | ✅ Implemented |

#### Services (Gig marketplace)

| Feature | Description | Status |
|---------|-------------|--------|
| Service creation | Title, description, price, category, delivery time | ✅ Implemented |
| Service catalog | Browse, filter (category, price, region, rating) | ✅ Implemented |
| Freelancer profile | Public `/freelancer/[id]` page | ✅ Implemented |
| Service packages | Tiered pricing (Basic/Standard/Premium) | ✅ Implemented |

#### Orders (Gig flow)

| Feature | Description | Status |
|---------|-------------|--------|
| Order creation | From service listing | ✅ Implemented |
| Status machine | `pending → active → delivered → completed / disputed` | ✅ Implemented |
| Revision flow | Client requests rework from `delivered` | ✅ Implemented |
| Order history | Dashboard views for both parties | ✅ Implemented |

#### Projects (Upwork-style)

| Feature | Description | Status |
|---------|-------------|--------|
| Project posting | `/post-project` with budget, skills | ✅ Implemented |
| Proposals | Freelancers apply with cover letter | ✅ Implemented |
| Hire flow | Client selects freelancer → contract | ✅ Implemented |
| Contracts & milestones | Milestone-based escrow | ✅ Implemented |

#### Payments & escrow

| Feature | Description | Status |
|---------|-------------|--------|
| Escrow hold/release/refund | Double-entry ledger | ✅ Implemented (sandbox) |
| Wallet top-up | Sandbox payment simulation | ✅ Implemented |
| Pay from wallet | `POST /pay-wallet` | ✅ Implemented |
| Platform commission | 10% on completed orders | ✅ Implemented |
| Withdrawal requests | Manual admin approval | ✅ Implemented |
| Auto-release | 3-day client inactivity after delivery | ✅ Implemented |
| Click integration | Merchant API v2 | ⚠️ Code ready; live credentials pending |
| Payme integration | Merchant API | ⚠️ Code ready; live credentials pending |

#### Communication

| Feature | Description | Status |
|---------|-------------|--------|
| Order/contract chat | REST send + Supabase Realtime receive | ✅ Implemented |
| Inbox | Batched thread API | ✅ Implemented |
| File attachments | Private bucket, order-scoped | ✅ Implemented |
| Notifications | In-app + email (Resend) + SMS (Eskiz) | ✅ Implemented |

#### Reviews & trust

| Feature | Description | Status |
|---------|-------------|--------|
| Post-order reviews | 1–5 stars + text | ✅ Implemented |
| Trust score | Reputation badge on profiles | ✅ Implemented |
| Fraud scanning | Message content flags | ✅ Implemented |
| Reports & moderation | User reports, admin queue | ✅ Implemented |

#### Admin

| Feature | Description | Status |
|---------|-------------|--------|
| User management | List, suspend, verify | ✅ Implemented |
| Order/escrow monitoring | Status overview, dispute queue | ✅ Implemented |
| Withdrawal approval | Finance tab | ✅ Implemented |
| Revenue charts | Commission analytics | ✅ Implemented |
| Audit log export | CSV download | ✅ Implemented |
| Platform health | `/health/ready` panel | ✅ Implemented |

#### Growth

| Feature | Description | Status |
|---------|-------------|--------|
| Referral program | 50,000 UZS bonus per referred user | ✅ Backend; ⚠️ widget UI partial |
| Vacancies | Job board module | ✅ Implemented |
| Companies | Company profiles & hiring | ✅ Implemented |
| Portfolio | Freelancer work gallery | ✅ Implemented |

### 4.3 MVP scope — OUT

Explicitly deferred beyond public beta.

| Feature | Rationale | Planned phase |
|---------|-----------|---------------|
| Live Click/Payme production | Merchant credentials not yet available | Pre-launch blocker |
| Production deployment | Vercel + Railway + Supabase prod | Pre-launch blocker |
| Pro/Business subscriptions | Monetization expansion | Growth (Q1 2027) |
| Mobile app (iOS/Android) | Web-first strategy | Scale |
| AI project assistant | Nice-to-have | Scale |
| Video calls (WebRTC) | Implemented as test feature; not MVP-critical | Growth |
| Automatic PDF contracts | Legal review needed | Growth |
| Skill tests / certification | Supply quality enhancement | Growth |
| Telegram bot | Notification channel expansion | Growth |
| Stripe / foreign cards | UZ market focus first | Scale |
| Elasticsearch search | Postgres full-text sufficient for launch | Growth |
| Fraud ML | Rule engine sufficient for beta | Scale |
| Regional map UI | Visual polish | Growth |
| KZ/KG expansion | Market expansion | Scale |

---

## 5. Non-functional requirements

| Requirement | Target |
|-------------|--------|
| Languages | uz (default), ru, en |
| Currency | UZS only (so'm) |
| Primary brand color | `#2563EB` |
| Mobile responsive | 375px minimum |
| LCP (Largest Contentful Paint) | < 2.5s |
| API availability | 99.5% (post-launch) |
| Auth | Fail closed — missing JWT → 401 |
| Financial integrity | Immutable ledger; double-entry escrow |
| Security | RLS + API validation + audit logs |

---

## 6. Key user journeys (summary)

1. **Freelancer onboarding:** Register → choose role → complete profile → publish service → receive order
2. **Client gig purchase:** Browse catalog → select service → pay (escrow) → chat → accept delivery → review
3. **Client project hire:** Post project → review proposals → hire → fund contract → approve milestones
4. **Dispute:** Client opens dispute → admin reviews → refund or release
5. **Withdrawal:** Freelancer requests payout → admin approves → bank transfer

Detailed flows: [USER_FLOWS.md](./USER_FLOWS.md)  
Business rules: [BUSINESS_LOGIC.md](./BUSINESS_LOGIC.md)

---

## 7. Monetization

| Model | Rate | Status |
|-------|------|--------|
| Transaction commission | 10% per completed order | ✅ Active |
| Pro subscription | ~99,000 UZS/month | 📋 Planned |
| Business subscription | ~499,000 UZS/month | 📋 Planned |
| Featured listing | ~50,000 UZS/week | 📋 Planned |

---

## 8. Risks & mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Payment provider delay | Blocks launch | Sandbox fully functional; dual provider (Click + Payme) |
| Low freelancer supply | Empty marketplace | Referral bonus (50k UZS); onboarding wizard |
| Trust deficit (new platform) | Low conversion | Escrow, verification badges, transparent commission |
| Dispute abuse | Admin overload | SLA timers, structured dispute workflow |
| Regulatory (financial) | Legal exposure | Escrow simulation → licensed merchant accounts |

---

## 9. Open decisions

| Decision | Options | Recommendation |
|----------|---------|----------------|
| Launch payment provider | Click vs Payme first | Either one sufficient for MVP |
| Beta size | 50 vs 100 users | Start with 50 verified users |
| Commission change | 10% vs 15% | Keep 10% for launch competitiveness |
| Auto-release period | 3 vs 7 days | Keep 3 days (current config) |

---

## 10. Related documents

| Document | Purpose |
|----------|---------|
| [BUSINESS_LOGIC.md](./BUSINESS_LOGIC.md) | Order, escrow, commission, referral rules |
| [USER_FLOWS.md](./USER_FLOWS.md) | Mermaid flow diagrams |
| [FEATURES.md](./FEATURES.md) | Feature inventory with status |
| [ROADMAP.md](./ROADMAP.md) | Phased timeline |
| [plan-status.md](../plan-status.md) | Current implementation status |
| [mvp.md](../mvp.md) | Original MVP sprint plan |

---

*Document owner: Product team · Review cycle: monthly or at milestone completion*
