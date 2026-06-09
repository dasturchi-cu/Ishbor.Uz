# IshBor.uz — Escrow & Project Marketplace Architecture

> **Maqsad:** Fiverr/Kwork (xizmat gig) + Upwork (loyiha board) uslubidagi to'liq marketplace.
> **To'lov:** Hozircha faqat `sandbox` (local/test). Click/Payme ulanmagan.
> **Holat:** Arxitektura hujjati + implementatsiya bosqichlari.

---

## 1. Hozirgi holat (audit)

| Qism | Mavjud | Yetishmaydi |
|------|--------|-------------|
| Xizmat gig (Kwork) | `services` + `orders` | — |
| Loyiha e'lonlari | `projects` | Kengaytirilgan status flow |
| Takliflar | `project_applications` | `proposals` nomi, contract bog'lanish |
| Escrow | `transactions` + RPC (`hold/release/refund`) | Contract/milestone escrow, alohida ledger |
| Chat | `messages` (faqat `order_id`) | Contract/project chat, fayl turlari |
| Nizo | `orders.status=disputed` | Structured disputes, admin thread |
| Sharhlar | `reviews` (client→freelancer) | Ikki tomonlama contract sharh |
| Admin | users, orders, withdrawals | Escrow monitoring, dispute SLA |
| Video/audio | — | WebRTC signaling (test) |

**Strategiya:** Mavjud jadvallarni **buzmasdan kengaytirish**. Yangi `contracts` markaziy entity bo'ladi.

---

## 2. Domain model

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│   Project    │◀────│ Freelancer  │
└─────────────┘     └──────┬───────┘     └─────────────┘
                           │ 1:N
                    ┌──────▼───────┐
                    │   Proposal   │  (= project_applications)
                    └──────┬───────┘
                           │ hire
                    ┌──────▼───────┐     ┌──────────────┐
                    │   Contract   │────▶│  Milestones  │
                    └──────┬───────┘     └──────────────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │  Escrow    │  │Conversation│  │  Dispute   │
    │ Transactions│  │ + Messages │  │ + Messages │
    └────────────┘  └────────────┘  └────────────┘
```

**Ikki marketplace oqimi:**

1. **Gig flow (mavjud):** Service → Order → Escrow → Deliver → Complete
2. **Project flow (yangi):** Project → Proposal → Contract → Escrow → Submit → Complete/Dispute

`orders` jadvali gig flow uchun qoladi. Project hire endi `contracts` yaratadi; `orders.order_id` ixtiyoriy bridge.

---

## 3. Status state machines

### 3.1 Project (`marketplace_project_status`)

| Status | Tavsif | Kim o'zgartiradi |
|--------|--------|------------------|
| `draft` | Yaratilmoqda, nashr qilinmagan | Client |
| `open` | Takliflar qabul qilinmoqda | Client (publish) |
| `in_review` | Client takliflarni ko'rib chiqmoqda | Auto (birinchi proposal) |
| `accepted` | Freelancer tanlandi, contract yaratildi | Client (hire) |
| `active` | Contract faol, ish bormoqda | Auto (escrow funded) |
| `submitted` | Freelancer natija topshirdi | Freelancer |
| `revision_requested` | Client qayta ishlash so'radi | Client |
| `completed` | Mijoz tasdiqladi | Client |
| `cancelled` | Bekor qilindi | Client (draft/open) / Admin |
| `disputed` | Nizo ochilgan | Client |

```
draft ──publish──▶ open ──first_proposal──▶ in_review
open/in_review ──hire──▶ accepted ──fund_escrow──▶ active
active ──submit──▶ submitted ──approve──▶ completed
submitted ──revision──▶ revision_requested ──resubmit──▶ submitted
active/submitted ──dispute──▶ disputed ──admin_resolve──▶ completed|cancelled|active
* ──cancel──▶ cancelled (faqat draft|open|accepted[pending_payment])
```

### 3.2 Proposal (`application_status` — mavjud)

`submitted → shortlisted → hired | rejected`

`hired` → `contracts` yaratiladi + boshqa proposal'lar `rejected`.

### 3.3 Contract (`contract_status`)

| Status | Tavsif |
|--------|--------|
| `pending_payment` | Yaratildi, escrow kutilmoqda |
| `active` | Escrow funded, ish boshlandi |
| `submitted` | Natija topshirildi |
| `revision_requested` | Qayta ishlash |
| `completed` | Tasdiqlangan, escrow released |
| `cancelled` | Bekor |
| `disputed` | Nizo |

### 3.4 Milestone (`milestone_status`)

`pending → funded → submitted → approved → released`

### 3.5 Dispute (`dispute_status`)

`open → responded → under_review → resolved_client | resolved_freelancer | closed`

---

## 4. Database schema

### 4.1 Yangi / kengaytirilgan jadvallar

| Jadval | Maqsad |
|--------|--------|
| `contracts` | Project hire shartnomasi |
| `proposals` | VIEW → `project_applications` |
| `escrow_transactions` | Batafsil escrow ledger |
| `milestones` | Qisman to'lov bosqichlari |
| `disputes` | Structured nizo |
| `dispute_messages` | Nizo chat |
| `project_files` | Deliverable / attachment |
| `project_reviews` | Ikki tomonlama sharh |
| `project_status_history` | Audit trail |
| `conversations` | Unified chat thread |
| `call_sessions` | WebRTC signaling (test) |
| `user_presence` | Online / typing |

### 4.2 `contracts`

```sql
contracts (
  id uuid PK,
  project_id uuid FK → projects,
  proposal_id uuid FK → project_applications UNIQUE,
  order_id uuid FK → orders NULL,          -- legacy bridge
  client_id uuid FK → profiles,
  freelancer_id uuid FK → profiles,
  title text NOT NULL,
  amount integer CHECK (> 0),
  deadline date,
  status contract_status DEFAULT 'pending_payment',
  payment_status payment_status DEFAULT 'unpaid',
  delivery_notes text,
  revision_count int DEFAULT 0,
  created_at, updated_at
)
```

Indexes: `client_id`, `freelancer_id`, `project_id`, `status`, `(client_id, status)`, `(freelancer_id, status)`

### 4.3 `escrow_transactions`

```sql
escrow_transactions (
  id uuid PK,
  source_type text CHECK (order|contract|milestone),
  source_id uuid NOT NULL,
  client_id uuid FK,
  freelancer_id uuid FK,
  amount integer CHECK (> 0),
  action text CHECK (fund|hold|release|refund|partial_release),
  provider text DEFAULT 'sandbox',
  provider_ref text,
  status text DEFAULT 'completed',
  metadata jsonb DEFAULT '{}',
  created_at
)
```

**Xavfsizlik:** INSERT faqat `security definer` RPC orqali (service role).

### 4.4 Chat kengaytirish

```sql
conversations (
  id uuid PK,
  type text CHECK (order|contract|project),
  order_id uuid NULL UNIQUE,
  contract_id uuid NULL UNIQUE,
  project_id uuid NULL,
  participant_ids uuid[] NOT NULL,
  created_at, updated_at
)

-- messages jadvaliga:
conversation_id uuid FK,
message_type text DEFAULT 'text',  -- text|image|file|document
attachments jsonb DEFAULT '[]',
metadata jsonb DEFAULT '{}'
```

### 4.5 Calls (local/test)

```sql
call_sessions (
  id uuid PK,
  conversation_id uuid FK,
  contract_id uuid FK NULL,
  initiator_id uuid FK,
  callee_id uuid FK,
  call_type text CHECK (one_to_one|interview|project_discussion),
  status text CHECK (initiated|ringing|active|ended|missed|declined),
  media_state jsonb,  -- {camera: bool, mic: bool, screen: bool}
  signaling jsonb,    -- WebRTC SDP/ICE (test)
  started_at, ended_at, created_at
)
```

Signaling: Supabase Realtime channel `call:{session_id}` yoki REST polling (MVP test).

---

## 5. API dizayn (`/api/v1`)

### 5.1 Projects (kengaytirish)

| Method | Path | Tavsif |
|--------|------|--------|
| POST | `/projects` | draft yaratish |
| POST | `/projects/{id}/publish` | draft → open |
| PATCH | `/projects/{id}/status` | state machine |
| GET | `/projects/{id}/history` | status history |

### 5.2 Proposals (= applications)

| Method | Path | Tavsif |
|--------|------|--------|
| POST | `/proposals` | taklif yuborish |
| GET | `/proposals/mine` | freelancer takliflari |
| GET | `/proposals/project/{id}` | client ko'radi |
| PATCH | `/proposals/{id}/status` | shortlist/reject/hire |

`/applications/*` backward-compat alias.

### 5.3 Contracts

| Method | Path | Tavsif |
|--------|------|--------|
| GET | `/contracts` | ro'yxat (role filter) |
| GET | `/contracts/{id}` | batafsil |
| PATCH | `/contracts/{id}/status` | submit/revision/complete |
| POST | `/contracts/{id}/fund` | sandbox escrow |
| GET | `/contracts/{id}/escrow` | escrow transactions |

### 5.4 Milestones

| Method | Path | Tavsif |
|--------|------|--------|
| POST | `/contracts/{id}/milestones` | yaratish |
| PATCH | `/milestones/{id}/status` | approve/release |

### 5.5 Disputes

| Method | Path | Tavsif |
|--------|------|--------|
| POST | `/contracts/{id}/disputes` | nizo ochish |
| GET | `/disputes/{id}` | batafsil |
| POST | `/disputes/{id}/messages` | javob |
| PATCH | `/admin/disputes/{id}/resolve` | admin qaror |

### 5.6 Conversations (chat)

| Method | Path | Tavsif |
|--------|------|--------|
| GET | `/conversations` | unified inbox |
| GET | `/conversations/{id}/messages` | xabarlar |
| POST | `/conversations/{id}/messages` | yuborish |
| POST | `/conversations/{id}/read` | o'qilgan |
| GET/PATCH | `/presence` | online/typing |

### 5.7 Calls

| Method | Path | Tavsif |
|--------|------|--------|
| POST | `/calls` | qo'ng'iroq boshlash |
| PATCH | `/calls/{id}` | accept/decline/end/signal |

### 5.8 Reviews

| Method | Path | Tavsif |
|--------|------|--------|
| POST | `/contracts/{id}/reviews` | ikki tomonlama |
| GET | `/contracts/{id}/reviews` | sharhlar |

### 5.9 Admin

| Method | Path | Tavsif |
|--------|------|--------|
| GET | `/admin/escrow` | escrow monitoring |
| GET | `/admin/disputes` | nizolar |
| PATCH | `/admin/disputes/{id}/resolve` | qaror |
| GET | `/admin/analytics/marketplace` | KPI |

---

## 6. Xavfsizlik

| Qoida | Implementatsiya |
|-------|----------------|
| Auth | Supabase JWT + `UserAuthDep` |
| Ownership | Har endpoint `client_id`/`freelancer_id` tekshiradi |
| Escrow manipulation | Faqat RPC + service role; amount server-side |
| Status transitions | `*_transitions.py` modullar |
| Admin | `profiles.is_admin` |
| Rate limit | POST messages, contracts, disputes |
| Idempotency | Escrow fund POST |
| RLS | Participant-only SELECT; mutation backend orqali |

---

## 7. Bildirishnomalar

| Hodisa | Type | Qabul qiluvchi |
|--------|------|----------------|
| Yangi proposal | `proposal` | Client |
| Proposal accepted | `proposal` | Freelancer |
| Escrow funded | `escrow` | Freelancer |
| Project submitted | `contract` | Client |
| Revision requested | `contract` | Freelancer |
| Project completed | `contract` | Freelancer |
| Yangi xabar | `message` | Qarshi tomon |
| Dispute opened | `dispute` | Freelancer + Admin |
| Call incoming | `call` | Callee |

---

## 8. Frontend modullar

```
src/presentation/features/
  marketplace/
    project-workspace-page.tsx    # Client project boshqaruvi
    contract-detail-page.tsx      # Contract lifecycle
    proposal-list.tsx
    escrow-dashboard.tsx
    dispute-page.tsx
  chat/
    conversation-thread.tsx       # Unified (order+contract)
    call-room.tsx                 # WebRTC test UI
  admin/
    admin-escrow-panel.tsx
    admin-disputes-panel.tsx
```

**Routing (`PATHS`):**
- `/projects/{id}/workspace` — client
- `/dashboard/contracts/{id}` — contract detail
- `/dashboard/escrow` — escrow overview
- `/dashboard/disputes/{id}` — dispute

---

## 9. Implementatsiya bosqichlari

### Faza 1 — Foundation (DB + Core API)
- [x] Migration: barcha jadvallar, enumlar, RPC
- [x] `contract_transitions.py`, `project_transitions.py`
- [x] Routers: contracts, proposals alias, disputes, milestones
- [x] Sandbox escrow RPC (contract)
- [x] Hire flow → contract (order bridge)

### Faza 2 — Communication
- [ ] Conversations + extended messages
- [ ] Realtime hooks
- [ ] Presence / typing
- [ ] Call signaling API + test UI

### Faza 3 — Reviews & Files
- [ ] project_files upload
- [ ] project_reviews (bidirectional)
- [ ] Deliverable submission flow

### Faza 4 — Admin & Frontend
- [ ] Admin escrow/dispute panels
- [ ] Marketplace analytics
- [ ] Full UI pages + i18n

### Faza 5 — Hardening
- [ ] Integration tests
- [ ] Status history audit
- [ ] Performance indexes review

---

## 10. Gig vs Project taqqoslash

| | Gig (Kwork) | Project (Upwork) |
|--|-------------|------------------|
| Entry | `services` | `projects` |
| Hire | Direct order | Proposal → Contract |
| Escrow | `orders` RPC | `contracts` RPC |
| Chat | `order` conversation | `contract` conversation |
| Review | `reviews.order_id` | `project_reviews.contract_id` |

Ikkala flow bir xil `escrow_transactions` ledger va `conversations` inbox orqali birlashtiriladi.

---

## 11. Test rejimi (sandbox escrow)

```python
# POST /contracts/{id}/fund
# provider = "sandbox" → darhol hold_escrow_contract_rpc
# Client wallet dan emas — to'g'ridan-to'g'ri sandbox "to'lov" simulyatsiyasi
# Production: payment_intent → webhook → hold RPC
```

Sandbox fund: `payment_status: unpaid → held`, `contract.status: pending_payment → active`.

---

*Oxirgi yangilanish: 2026-06-09*
