# Database Schema

PostgreSQL schema for IshBor.uz, managed via Supabase migrations.

---

## Overview

| Property | Value |
|----------|-------|
| **Engine** | PostgreSQL 15+ (Supabase managed) |
| **Tables** | 57+ in `public` schema |
| **Migrations** | 66 files |
| **Auth** | `auth.users` (Supabase Auth) |
| **RLS** | Enabled on all business tables |
| **Hub table** | `profiles` (FK to `auth.users.id`) |

---

## Entity relationship (core)

See [ERD.md](./ERD.md) for the full diagram.

---

## Core tables

### `profiles`

Central user table, auto-created on signup via `handle_new_user` trigger.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | FK → `auth.users.id` |
| `role` | user_role | `freelancer` or `client` |
| `full_name` | text | Display name |
| `email` | text | Email address |
| `username` | text UNIQUE | Public slug |
| `phone` | text | Phone number |
| `bio` | text | Profile bio |
| `region` | text | Uzbekistan region |
| `specialty` | text | Primary specialty |
| `avatar_url` | text | Avatar storage URL |
| `skills` | text[] | Skill tags |
| `hourly_rate` | numeric | Hourly rate (so'm) |
| `wallet_balance` | numeric | Internal wallet (API-only writes) |
| `is_admin` | boolean | Admin flag |
| `admin_role` | text | `super_admin`, `admin`, `moderator`, `support` |
| `is_banned` | boolean | Ban flag |
| `is_suspended` | boolean | Suspension flag |
| `is_verified` | boolean | Verification badge |
| `referral_code` | text UNIQUE | User's referral code |
| `referred_by` | uuid FK | Referrer profile |
| `onboarding_completed` | boolean | Onboarding gate |
| `notification_preferences` | jsonb | Channel preferences |
| `ui_preferences` | jsonb | Theme, layout prefs |

---

### `services`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | |
| `freelancer_id` | uuid FK → profiles | Owner |
| `title` | text | Service title |
| `description` | text | Full description |
| `price` | numeric | Base price (so'm) |
| `category` | text | Category slug |
| `region` | text | Service region |
| `delivery_days` | int | Delivery timeframe |
| `packages` | jsonb | Tier packages (basic/standard/premium) |
| `image_urls` | text[] | Gallery images |
| `includes` | text[] | What's included |
| `faq` | jsonb | FAQ items |
| `moderation_status` | service_moderation_status | `pending`, `approved`, `rejected` |
| `is_hidden` | boolean | Hidden from catalog |
| `view_count` | int | View counter |

---

### `orders`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | |
| `service_id` | uuid FK → services | Source service (nullable) |
| `client_id` | uuid FK → profiles | Buyer |
| `freelancer_id` | uuid FK → profiles | Seller |
| `amount` | numeric | Order amount (so'm) |
| `status` | order_status | State machine status |
| `payment_status` | payment_status | `unpaid`, `held`, `released`, `refunded` |
| `package_id` | text | Selected package tier |
| `platform_fee` | numeric | Commission amount |
| `project_id` | uuid FK | Linked project (nullable) |
| `contract_id` | uuid FK | Linked contract (nullable) |
| `delivered_at` | timestamptz | Delivery timestamp |
| `auto_release_at` | timestamptz | Auto-release deadline |
| `auto_released` | boolean | Auto-released flag |

**Note:** No client UPDATE RLS policy — status changes via API only.

---

### `projects`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | |
| `client_id` | uuid FK → profiles | Project owner |
| `title` | text | Project title |
| `description` | text | Requirements |
| `budget` | numeric | Budget (so'm) |
| `budget_type` | text | `fixed` or `hourly` |
| `status` | project_status | State machine |
| `is_public` | boolean | Visible in catalog |
| `skills` | text[] | Required skills |
| `region` | text | Region |
| `deadline` | date | Target deadline |

---

### `project_applications` (alias: `proposals`)

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | |
| `project_id` | uuid FK → projects | |
| `freelancer_id` | uuid FK → profiles | Applicant |
| `cover_letter` | text | Proposal text |
| `proposed_budget` | numeric | Bid amount |
| `proposed_days` | int | Estimated days |
| `status` | application_status | `submitted`, `shortlisted`, `rejected`, `hired` |

---

### `contracts`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | |
| `project_id` | uuid FK → projects | |
| `proposal_id` | uuid FK UNIQUE | Accepted proposal |
| `client_id` | uuid FK → profiles | |
| `freelancer_id` | uuid FK → profiles | |
| `amount` | numeric | Contract value |
| `status` | contract_status | State machine |
| `payment_status` | payment_status | Escrow status |
| `deadline` | date | Contract deadline |
| `revision_count` | int | Revision counter |

---

### `milestones`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | |
| `contract_id` | uuid FK → contracts | |
| `title` | text | Milestone name |
| `amount` | numeric | Milestone value |
| `status` | milestone_status | State machine |
| `sort_order` | int | Display order |
| `due_date` | date | Due date |

---

## Financial tables

### `payment_intents`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | Used as Payme account field |
| `order_id` | uuid FK → orders | |
| `client_id` | uuid FK → profiles | |
| `provider` | text | `sandbox`, `click`, `payme` |
| `amount` | numeric | Payment amount |
| `status` | text | `pending`, `completed`, `failed`, `cancelled` |
| `idempotency_key` | text | Duplicate prevention |

### `escrow_transactions`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | |
| `source_type` | escrow_source_type | `order`, `contract`, `milestone` |
| `source_id` | uuid | Polymorphic FK |
| `action` | escrow_action | `hold`, `release`, `refund`, etc. |
| `amount` | numeric | Transaction amount |
| `client_id` | uuid FK | |
| `freelancer_id` | uuid FK | |

### `ledger_entries`

Immutable double-entry ledger. Protected by database trigger — no UPDATE/DELETE.

| Column | Type | Description |
|--------|------|-------------|
| `transaction_group_id` | uuid | Pairs debit/credit |
| `account_code` | text FK → ledger_accounts | |
| `entry_type` | text | `debit` or `credit` |
| `amount` | numeric | Entry amount |
| `user_id` | uuid FK | Associated user |
| `order_id` | uuid FK | Associated order |

### `withdrawal_requests`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | |
| `freelancer_id` | uuid FK → profiles | |
| `amount` | numeric | Withdrawal amount |
| `status` | text | `pending`, `approved`, `rejected`, `completed` |
| `bank_account_id` | uuid FK → bank_accounts | |

---

## Communication tables

### `conversations`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | |
| `type` | conversation_type | `order`, `contract`, `project` |
| `order_id` | uuid FK UNIQUE | |
| `contract_id` | uuid FK UNIQUE | |
| `participant_ids` | uuid[] | Thread participants |

### `messages`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | |
| `conversation_id` | uuid FK | |
| `sender_id` | uuid FK → profiles | |
| `receiver_id` | uuid FK → profiles | |
| `content` | text | Message text |
| `message_type` | message_content_type | `text`, `image`, `file` |
| `attachments` | jsonb | File metadata |
| `read_at` | timestamptz | Read timestamp |

Realtime-enabled: `supabase_realtime` publication with `REPLICA IDENTITY FULL`.

---

## Enums

| Enum | Values |
|------|--------|
| `user_role` | `freelancer`, `client` |
| `order_status` | `pending`, `active`, `delivered`, `completed`, `disputed`, `cancelled` |
| `project_status` | `draft`, `open`, `closed`, `in_progress`, `in_review`, `accepted`, `active`, `submitted`, `revision_requested`, `completed`, `cancelled`, `disputed` |
| `contract_status` | `pending_payment`, `active`, `submitted`, `revision_requested`, `completed`, `cancelled`, `disputed` |
| `milestone_status` | `pending`, `funded`, `submitted`, `approved`, `released`, `cancelled` |
| `payment_status` | `unpaid`, `held`, `released`, `refunded` |
| `application_status` | `submitted`, `shortlisted`, `rejected`, `hired` |
| `dispute_status` | `open`, `responded`, `under_review`, `resolved_client`, `resolved_freelancer`, `closed` |
| `escrow_action` | `fund`, `hold`, `release`, `refund`, `partial_release` |
| `verification_type` | `identity`, `freelancer`, `employer`, `company` |
| `verification_status` | `pending`, `approved`, `rejected` |

---

## RPC functions (SECURITY DEFINER)

| Function | Purpose |
|----------|---------|
| `hold_escrow_rpc` | Move payment to escrow hold |
| `release_escrow_rpc` | Release escrow to freelancer |
| `refund_escrow_rpc` | Refund escrow to client |
| `credit_wallet_topup_rpc` | Credit wallet after top-up |
| `debit_wallet_rpc` | Debit wallet for order payment |

Called only from backend via `service_role` client.

---

## Views

| View | Purpose | Access |
|------|---------|--------|
| `proposals` | Alias for `project_applications` | Security invoker |
| `participant_profiles` | Safe peer profile fields | service_role only |
| `public_dispute_stats` | Aggregated dispute metrics | service_role only |

---

## Indexes & performance

Key indexes created across migrations:

- `profiles(username)`, `profiles(referral_code)`
- `services(freelancer_id, moderation_status)`
- `orders(client_id, freelancer_id, status)`
- `messages(conversation_id, created_at)`
- `notifications(user_id, read_at)`
- `payment_intents(order_id, status)`

---

## Related documents

- [ERD.md](./ERD.md)
- [MIGRATIONS.md](./MIGRATIONS.md)
- [AUTHORIZATION.md](./AUTHORIZATION.md)
