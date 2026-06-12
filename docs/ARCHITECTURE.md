# Architecture

**IshBor.uz** — system architecture for the Uzbekistan freelance marketplace.

| Document | Version | Last updated |
|----------|---------|--------------|
| Architecture | 1.0 | 2026-06-12 |

---

## Executive summary

IshBor.uz is a **three-tier SaaS marketplace**:

1. **Next.js frontend** — SSR/CSR hybrid, App Router, Clean Architecture in `src/`
2. **FastAPI backend** — business logic, payments, admin, authorization
3. **Supabase** — PostgreSQL, Auth, Storage, Realtime

The frontend never mutates business data directly. Supabase is used only for auth, file uploads, and realtime subscriptions.

---

## High-level architecture

```mermaid
flowchart TB
  subgraph Users
    CL["Clients"]
    FL["Freelancers"]
    AD["Admins"]
  end

  subgraph Edge["Edge / CDN"]
    Vercel["Vercel — Next.js"]
    CF["Cloudflare Turnstile"]
  end

  subgraph App["Application tier"]
  FE["Next.js 16 Frontend"]
  API["FastAPI /api/v1"]
  end

  subgraph Data["Data tier"]
    SB["Supabase PostgreSQL"]
    SBA["Supabase Auth"]
    SBS["Supabase Storage"]
    SBR["Supabase Realtime"]
  end

  subgraph External["External services"]
    Click["Click SHOP-API"]
    Payme["Payme Merchant"]
    Resend["Resend Email"]
    Eskiz["Eskiz SMS"]
    TG["Telegram Bot"]
    Sentry["Sentry"]
  end

  Users --> Vercel
  Vercel --> FE
  FE -->|"Group A: auth, storage, subscribe"| SBA
  FE --> SBS
  FE --> SBR
  FE -->|"Group B: all business logic"| API
  API --> SB
  API --> SBA
  Click --> API
  Payme --> API
  API --> Resend
  API --> Eskiz
  API --> TG
  FE --> Sentry
  API --> Sentry
  CF --> FE
```

---

## Integration boundary (critical rule)

```mermaid
flowchart LR
  subgraph GroupA["Group A — Direct Supabase"]
    A1["auth.*"]
    A2["storage.upload"]
    A3["realtime.subscribe"]
  end

  subgraph GroupB["Group B — FastAPI only"]
    B1["profiles, orders, payments"]
    B2["chat send, reviews"]
    B3["admin, escrow, disputes"]
  end

  FE["Frontend"] --> GroupA
  FE --> GroupB
  GroupB --> API["FastAPI"]
  API --> DB["PostgreSQL"]
  GroupA --> DB
```

| Operation | Path | Rationale |
|-----------|------|-----------|
| Login / Register | `supabase.auth.*` | JWT lifecycle owned by Supabase Auth |
| Avatar upload | `storage.from('avatars')` | RLS-scoped paths |
| Chat receive | Realtime `postgres_changes` | Push-only; send via API |
| Create order | `api.createOrder()` | Validation, escrow, fraud |
| Pay order | `api.checkout()` | Payment intent, provider integration |
| Update profile | `api.patchProfile()` | Privileged field guards |

Full classification: [architecture-supabase-vs-api.md](./architecture-supabase-vs-api.md)

---

## Clean Architecture (frontend)

```mermaid
flowchart TB
  subgraph presentation["presentation/"]
    UI["components/ui"]
    Features["features/*"]
  end

  subgraph application["application/"]
    Providers["providers/"]
  end

  subgraph domain["domain/"]
    Entities["entities/"]
    Constants["constants/"]
    Validators["validators/"]
  end

  subgraph infrastructure["infrastructure/"]
    APIClient["api/client.ts"]
    I18n["i18n/"]
    Supabase["supabase/"]
  end

  subgraph shared["shared/lib/"]
    Hooks["hooks, caches, formatters"]
  end

  presentation --> application
  presentation --> shared
  application --> domain
  infrastructure --> domain
  presentation -.->|"via api.* only"| infrastructure
```

**Dependency rule:** `presentation` does not import `infrastructure` repositories directly for business mutations — it uses `api.*` from `@/infrastructure/api/client`.

---

## Backend architecture

```mermaid
flowchart TB
  subgraph Routers["routers/ (27 routers)"]
    R1["profiles, services, orders"]
    R2["payments, contracts, milestones"]
    R3["messages, conversations, admin"]
  end

  subgraph Services["service layer"]
    S1["payment_service, escrow"]
    S2["notification_service"]
    S3["security_service, fraud_service"]
  end

  subgraph DataAccess["database.py"]
    UC["User client (RLS + JWT)"]
    AC["Admin client (service_role)"]
  end

  Routers --> Services
  Services --> DataAccess
  DataAccess --> PG["PostgreSQL"]
```

### Cross-cutting middleware

| Middleware | Purpose |
|------------|---------|
| CORS | Origin allowlist |
| Rate limit | IP/user buckets (Redis or Postgres) |
| Idempotency | Duplicate POST protection |
| Origin guard | Production referer validation |
| Sentry | Error capture |

---

## Dual marketplace model

IshBor.uz supports two hiring flows:

### Gig flow (Kwork-style)

```
Service → Order → Payment → Delivery → Review
```

### Project flow (Upwork-style)

```
Project → Application/Proposal → Contract → Milestones → Review
```

Both share: escrow, chat, disputes, wallet, notifications.

```mermaid
flowchart LR
  subgraph Gig
    S["services"] --> O["orders"]
  end

  subgraph Project
    P["projects"] --> A["project_applications"]
    A --> C["contracts"]
    C --> M["milestones"]
  end

  O --> E["escrow_transactions"]
  C --> E
  M --> E
```

---

## Authentication flow

```mermaid
sequenceDiagram
  participant U as User
  participant FE as Next.js
  participant SB as Supabase Auth
  participant MW as proxy.ts
  participant API as FastAPI

  U->>FE: Login
  FE->>SB: signInWithPassword
  SB-->>FE: access_token (JWT)
  FE->>API: GET /profiles/me (Bearer JWT)
  API->>SB: Verify JWT (HS256/JWKS)
  API-->>FE: Profile data
  U->>FE: Navigate /dashboard
  FE->>MW: Request with cookies
  MW->>SB: getUser()
  MW->>MW: Check ban, onboarding, admin
  MW-->>FE: Allow or redirect
```

---

## Data flow — payment & escrow

```mermaid
sequenceDiagram
  participant C as Client
  participant FE as Frontend
  participant API as FastAPI
  participant DB as PostgreSQL
  participant PP as Click/Payme

  C->>FE: Checkout order
  FE->>API: POST /payments/orders/{id}/checkout
  API->>DB: Create payment_intent
  API-->>FE: Redirect URL
  FE->>PP: User pays
  PP->>API: Webhook (signed)
  API->>DB: hold_escrow_rpc
  API->>DB: Update order status → active
  API-->>PP: OK
```

---

## Deployment topology

See [DEPLOYMENT.md](./DEPLOYMENT.md) and [INFRASTRUCTURE.md](./INFRASTRUCTURE.md).

| Component | Target platform |
|-----------|-----------------|
| Frontend | Vercel |
| Backend API | Railway / Render / Docker |
| Database | Supabase (managed PostgreSQL) |
| Storage | Supabase Storage |
| Cron jobs | Railway cron / external scheduler → `X-Cron-Secret` |

---

## Scalability strategy

| Layer | Strategy |
|-------|----------|
| Frontend | Vercel edge CDN, static optimization, ISR where applicable |
| API | Horizontal scaling (stateless FastAPI containers) |
| Database | Supabase connection pooling, read replicas (Pro plan) |
| Rate limiting | Redis for distributed buckets |
| Caching | Public stats cached 5 min; profile middleware cache |
| Realtime | Targeted channel subscriptions per user/order |

Details: [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md#scaling-strategy)

---

## Related documents

- [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) — detailed design decisions
- [TECH_STACK.md](./TECH_STACK.md) — technology choices
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) — directory layout
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — data model
- [AUTHENTICATION.md](./AUTHENTICATION.md) — auth implementation
- [marketplace-escrow-architecture.md](./marketplace-escrow-architecture.md) — escrow deep dive
