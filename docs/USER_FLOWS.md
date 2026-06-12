# User Flows

Visual flow diagrams for core IshBor.uz user journeys.

**Last updated:** 2026-06-12  
**Notation:** Mermaid diagrams — render in GitHub, VS Code, or any Mermaid-compatible viewer.

---

## 1. Registration & onboarding

New user signs up, selects role, and completes profile setup.

```mermaid
flowchart TD
  A[Landing page /] --> B{Has account?}
  B -->|No| C[/register]
  B -->|Yes| D[/login]

  C --> E[Enter email + password]
  E --> F[Supabase Auth: signUp]
  F --> G{Email verified?}
  G -->|No| H[Check email prompt]
  G -->|Yes| I[Redirect to onboarding]

  I --> J[Choose role: Freelancer or Client]
  J --> K[Complete profile]
  K --> K1[Name, bio, region from 14 regions]
  K1 --> K2[Upload avatar optional]
  K2 --> L{Referral code?}
  L -->|Yes| M[POST /profiles/me/referral]
  L -->|No| N[Skip]
  M --> O[Dashboard]
  N --> O

  O --> P{Role?}
  P -->|Freelancer| Q[/dashboard — services tab]
  P -->|Client| R[/dashboard/client]

  Q --> Q1[Onboarding: Create first service]
  R --> R1[Onboarding: Browse catalog or post project]

  D --> S[Supabase Auth: signInWithPassword]
  S --> T[JWT stored in session]
  T --> U[GET /profiles/me]
  U --> V{Profile complete?}
  V -->|No| I
  V -->|Yes| O
```

### Key decision points

| Step | Decision | Outcome |
|------|----------|---------|
| Role selection | Freelancer vs Client | Determines default dashboard and available actions |
| Referral code | Optional at signup | Links `referred_by`; bonus on first completed order |
| Onboarding | Profile completeness | Middleware may redirect incomplete profiles |

---

## 2. Gig order flow (Kwork-style)

Client purchases a fixed-price service from the catalog.

```mermaid
flowchart TD
  A[Browse /services] --> B[Filter: category, price, region, rating]
  B --> C[View service detail]
  C --> D[View /freelancer/id profile]
  C --> E[Select package optional]
  E --> F[Click Order Now]
  F --> G{Logged in?}
  G -->|No| H[/login redirect]
  G -->|Yes| I[Order form: requirements + deadline]
  H --> I

  I --> J[Create order — status: pending]
  J --> K{Payment method?}

  K -->|Click/Payme| L[POST /payments/orders/id/checkout]
  L --> M[Redirect to payment provider]
  M --> N[User pays on Click/Payme]
  N --> O[Webhook: payment confirmed]
  O --> P[Escrow HOLD — full amount]

  K -->|Wallet| Q[POST /pay-wallet]
  Q --> P

  P --> R[Order status: active]
  R --> S[Chat thread created]
  S --> T[Freelancer works on order]

  T --> U[Freelancer marks delivered]
  U --> V[Order status: delivered]
  V --> W[auto_release_at = now + 3 days]
  W --> X{Client action?}

  X -->|Accept| Y[Order status: completed]
  X -->|Request revision| Z[Order status: active]
  X -->|Open dispute| AA[Order status: disputed]
  X -->|No action 3 days| AB[Auto-release cron]

  Y --> AC[Escrow RELEASE — 90% to freelancer]
  AC --> AD[Commission 10% to platform]
  AD --> AE[Referral bonus check]
  AE --> AF[Leave review 1-5 stars]
  AB --> AC

  Z --> T
  AA --> AG[Admin dispute resolution]
  AG --> AH{Resolution?}
  AH -->|Client wins| AI[Escrow REFUND]
  AH -->|Freelancer wins| AC
  AH -->|Return to work| Z
```

### Sequence diagram — payment to completion

```mermaid
sequenceDiagram
  participant C as Client
  participant FE as Frontend
  participant API as FastAPI
  participant PP as Click/Payme
  participant DB as PostgreSQL
  participant F as Freelancer

  C->>FE: Order service
  FE->>API: POST /orders
  API->>DB: Insert order (pending)
  C->>FE: Checkout
  FE->>API: POST /payments/orders/{id}/checkout
  API->>DB: Create payment_intent
  API-->>FE: Redirect URL
  FE->>PP: User pays
  PP->>API: Webhook (signed)
  API->>DB: hold_escrow_rpc
  API->>DB: order.status = active
  API->>F: Notification: new order

  F->>API: PATCH /orders/{id}/status (delivered)
  API->>DB: status = delivered, auto_release_at set
  API->>C: Notification: delivery ready

  C->>API: PATCH /orders/{id}/status (completed)
  API->>DB: release_escrow_rpc (90% payout, 10% fee)
  API->>DB: status = completed
  API->>F: Notification: payment released
  C->>API: POST /reviews
```

---

## 3. Project hire flow (Upwork-style)

Client posts a project, reviews proposals, and hires a freelancer via contract.

```mermaid
flowchart TD
  A[Client: /post-project] --> B[Fill project details]
  B --> B1[Title, description, budget, skills, region]
  B1 --> C[Save as draft or publish]
  C --> D[Project status: open]
  D --> E[Visible on /projects catalog]

  E --> F[Freelancers browse projects]
  F --> G[Freelancer submits proposal]
  G --> G1[Cover letter + bid amount + timeline]
  G1 --> H[Application status: submitted]
  H --> I[Project status: in_review]
  I --> J[Client reviews proposals]

  J --> K{Decision?}
  K -->|Reject| L[Application status: rejected]
  K -->|Shortlist| M[Application status: shortlisted]
  K -->|Hire| N[Application status: hired]

  N --> O[Create contract — pending_payment]
  O --> P[Other proposals auto-rejected]
  P --> Q[Project status: accepted]

  Q --> R{Milestones?}
  R -->|Yes| S[Define milestone amounts]
  R -->|No| T[Single contract amount]

  S --> U[Client funds first milestone]
  T --> U
  U --> V[Escrow HOLD]
  V --> W[Contract status: active]
  W --> X[Project status: active]

  X --> Y[Chat + work in progress]
  Y --> Z[Freelancer submits work]
  Z --> AA[Contract status: submitted]

  AA --> BB{Client action?}
  BB -->|Approve| CC[Contract status: completed]
  BB -->|Request revision| DD[Contract status: revision_requested]
  BB -->|Open dispute| EE[Contract status: disputed]

  DD --> Y
  CC --> FF[Escrow RELEASE per milestone]
  FF --> GG[Commission 10% deducted]
  GG --> HH[Review + referral bonus check]

  EE --> II[Admin dispute resolution]
  II --> JJ{Resolution?}
  JJ -->|Client| KK[REFUND]
  JJ -->|Freelancer| FF
  JJ -->|Continue| Y

  S --> MM{More milestones?}
  MM -->|Yes| U
  MM -->|No| CC
```

### Hire sequence

```mermaid
sequenceDiagram
  participant CL as Client
  participant API as FastAPI
  participant DB as PostgreSQL
  participant FL as Freelancer

  CL->>API: POST /projects
  API->>DB: project (open)
  FL->>API: POST /applications
  API->>DB: application (submitted)
  API->>CL: Notification: new proposal

  CL->>API: POST /applications/{id}/hire
  API->>DB: application (hired)
  API->>DB: contract (pending_payment)
  API->>DB: other applications (rejected)
  API->>FL: Notification: hired

  CL->>API: POST /payments/contracts/{id}/checkout
  API->>DB: hold_escrow_rpc
  API->>DB: contract (active)
  API->>FL: Notification: contract funded

  FL->>API: PATCH /contracts/{id}/status (submitted)
  CL->>API: PATCH /contracts/{id}/status (completed)
  API->>DB: release_escrow_rpc
  API->>FL: Notification: payment released
```

---

## 4. Dispute flow

Client opens a dispute; admin mediates and resolves.

```mermaid
flowchart TD
  A[Order: active or delivered] --> B[Client clicks Open Dispute]
  A2[Contract: active, submitted, or revision_requested] --> B

  B --> C[Enter reason min 10 characters]
  C --> D[POST /disputes/order/{id} or /disputes/contract/{id}]
  D --> E[Dispute created — status: open]
  E --> F[Order/Contract status: disputed]
  F --> G[Escrow FROZEN]

  G --> H[Freelancer notified]
  H --> I[Freelancer responds]
  I --> J[POST /disputes/{id}/messages]
  J --> K[Dispute status: responded]

  K --> L[Admin picks up case]
  L --> M[Dispute status: under_review]
  M --> N[Admin reviews evidence]
  N --> N1[Dispute thread messages]
  N --> N2[Order chat history]
  N --> N3[Deliverables / attachments]

  N --> O{Admin decision?}

  O -->|Client wins| P[resolved_client]
  P --> Q[refund_escrow_rpc]
  Q --> R[Funds to client wallet]
  R --> S[Order/Contract: cancelled]

  O -->|Freelancer wins| T[resolved_freelancer]
  T --> U[release_escrow_rpc]
  U --> V[90% to freelancer, 10% commission]
  V --> W[Order/Contract: completed]

  O -->|Return to work| X[Order/Contract: active]
  X --> Y[Dispute: closed]
  Y --> Z[Escrow remains held]

  S --> AA[Both parties notified]
  W --> AA
  Y --> AA
```

### Dispute timeline

```mermaid
gantt
  title Dispute SLA targets
  dateFormat X
  axisFormat %Hh

  section Client
  Open dispute           :a1, 0, 1h
  Provide evidence       :a2, after a1, 24h

  section Freelancer
  Respond to dispute     :b1, after a1, 24h

  section Admin
  Review case            :c1, after b1, 24h
  Resolve dispute        :c2, after c1, 48h
```

| SLA | Target | Escalation |
|-----|--------|------------|
| Freelancer response | 24 hours | Reminder notification |
| Admin pickup | 24 hours | Auto-flag in moderation queue |
| Resolution | 72 hours total | Escalate to senior admin |

---

## 5. Wallet & withdrawal flow

Freelancer earns from completed orders and withdraws to bank.

```mermaid
flowchart TD
  A[Order/Contract completed] --> B[Escrow release]
  B --> C[90% credited to wallet_balance]
  C --> D[Transaction: escrow_release]

  E[Referral bonus] --> C
  F[Sandbox top-up] --> C

  C --> G[Freelancer: /dashboard/wallet]
  G --> H{Action?}

  H -->|Pay for order| I[POST /pay-wallet]
  I --> J[Debit wallet, fund escrow]

  H -->|Withdraw| K{Bank verified?}
  K -->|No| L[Add bank account + verify]
  L --> M[Admin verifies bank]
  M --> K

  K -->|Yes| N[Request withdrawal amount]
  N --> O[POST /withdrawals]
  O --> P[Status: pending]
  P --> Q[Admin reviews in /admin]
  Q --> R{Approved?}

  R -->|Yes| S[Debit wallet_balance]
  S --> T[Manual bank transfer offline]
  T --> U[Status: completed]

  R -->|No| V[Status: rejected]
  V --> W[Funds remain in wallet]
```

---

## 6. Referral flow

User invites others and earns 50,000 UZS per successful referral.

```mermaid
flowchart TD
  A[User A: existing account] --> B[GET /profiles/me/referral-stats]
  B --> C[Copy referral link/code]
  C --> D[Share via social, Telegram, etc.]

  D --> E[User B: clicks link]
  E --> F[/register?ref=CODE]
  F --> G[Register account]
  G --> H[POST /profiles/me/referral]
  H --> I[profiles.referred_by = User A]
  I --> J[referrals row created]

  J --> K[User B uses platform]
  K --> L[User B completes FIRST order]
  L --> M[Order status: completed]
  M --> N[try_credit_referral_bonus]

  N --> O{Already credited?}
  O -->|Yes| P[Skip]
  O -->|No| Q[User A wallet += 50,000 UZS]
  Q --> R[Transaction: referral_bonus]
  R --> S[referrals.bonus_credited = true]
  S --> T[Notify User A: bonus earned]
```

---

## 7. Admin moderation flow

Admin handles verification, disputes, and withdrawals.

```mermaid
flowchart TD
  A[/admin] --> B{Admin role?}
  B -->|super_admin, admin| C[Full access]
  B -->|moderator| D[Moderation + disputes]
  B -->|support| E[Read-only + disputes]

  C --> F[Dashboard tabs]
  F --> G[Users — suspend, verify]
  F --> H[Orders — monitor status]
  F --> I[Escrow — held funds overview]
  F --> J[Disputes — resolve queue]
  F --> K[Withdrawals — approve/reject]
  F --> L[Verification queue — KYC, bank]
  F --> M[Reports — fraud flags]
  F --> N[Revenue charts]
  F --> O[Audit log export]

  J --> P[Review dispute evidence]
  P --> Q[Resolve: client / freelancer / return]
  Q --> R[Escrow action executed]
  R --> S[Parties notified]

  K --> T{Valid bank + balance?}
  T -->|Yes| U[Approve withdrawal]
  T -->|No| V[Reject with reason]
```

---

## 8. Related documents

| Document | Purpose |
|----------|---------|
| [BUSINESS_LOGIC.md](./BUSINESS_LOGIC.md) | Rules behind these flows |
| [PRODUCT_REQUIREMENTS.md](./PRODUCT_REQUIREMENTS.md) | Scope and personas |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System integration diagrams |
| [AUTHENTICATION.md](./AUTHENTICATION.md) | Auth sequence details |

---

*Flows reflect implemented behavior as of MVP ~75–80%. Live Click/Payme adds provider redirect steps identical to sandbox checkout.*
