# API Reference

Complete endpoint reference for IshBor.uz FastAPI backend (`/api/v1`).

**Legend:** 🔓 Public · 🔐 Auth · 👤 Optional · 🛡️ Admin · 🔗 Webhook · ⏰ Cron

---

## Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | 🔓 | API status and environment |
| GET | `/health/live` | 🔓 | Liveness probe |
| GET | `/health/ready` | 🔓 | DB, migrations, config readiness |

---

## Profiles

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/profiles/me` | 🔐 | Current user profile |
| PATCH | `/profiles/me` | 🔐 | Update profile |
| PATCH | `/profiles/me/role` | 🔐 | Switch freelancer/client role |
| DELETE | `/profiles/me` | 🔐 | Delete account |
| GET | `/profiles/check-username` | 👤 | Username availability |
| GET | `/profiles/me/notification-prefs` | 🔐 | Get notification preferences |
| PATCH | `/profiles/me/notification-prefs` | 🔐 | Update notification preferences |
| GET | `/profiles/me/ui-preferences` | 🔐 | Get UI preferences |
| PATCH | `/profiles/me/ui-preferences` | 🔐 | Update UI preferences |
| POST | `/profiles/me/referral` | 🔐 | Apply referral code |
| GET | `/profiles/me/referral-stats` | 🔐 | Referral statistics |
| GET | `/profiles/me/analytics` | 🔐 | User analytics by period |
| GET | `/profiles/freelancers` | 🔓 | List public freelancers |
| GET | `/profiles/{profile_id}` | 🔓 | Public profile by UUID/username |
| POST | `/profiles/{profile_id}/view` | 👤 | Record profile view |

---

## Services

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/services` | 🔓 | Catalog with filters |
| GET | `/services/mine` | 🔐 | Own services |
| GET | `/services/{service_id}` | 🔓 | Service detail |
| GET | `/services/freelancer/{freelancer_id}` | 🔓 | Freelancer's services |
| POST | `/services` | 🔐 | Create service |
| PATCH | `/services/{service_id}` | 🔐 | Update service |
| DELETE | `/services/{service_id}` | 🔐 | Delete service |
| POST | `/services/{service_id}/view` | 👤 | Record service view |

---

## Orders

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/orders` | 🔐 | List user's orders |
| POST | `/orders` | 🔐 | Create order |
| GET | `/orders/{order_id}` | 🔐 | Order detail |
| PATCH | `/orders/{order_id}/status` | 🔐 | Update order status |

---

## Payments

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/payments/config` | 🔓 | Available payment providers |
| POST | `/payments/orders/{order_id}/checkout` | 🔐 | Start checkout |
| GET | `/payments/orders/{order_id}/payment-intent` | 🔐 | Latest payment intent |
| GET | `/payments/orders/{order_id}/transactions` | 🔐 | Order transactions |
| POST | `/payments/orders/{order_id}/pay-wallet` | 🔐 | Pay from wallet balance |
| POST | `/payments/wallet/topup` | 🔐 | Create wallet top-up intent |
| GET | `/payments/wallet/topup/{intent_id}` | 🔐 | Top-up intent status |
| GET | `/payments/transactions` | 🔐 | User transaction history |
| POST | `/payments/withdrawals` | 🔐 | Request withdrawal |
| GET | `/payments/withdrawals` | 🔐 | List withdrawals |
| POST | `/payments/webhooks/click/prepare` | 🔗 | Click prepare webhook |
| POST | `/payments/webhooks/click/complete` | 🔗 | Click complete webhook |
| POST | `/payments/webhooks/click` | 🔗 | Legacy Click webhook |
| POST | `/payments/webhooks/payme` | 🔗 | Payme Merchant webhook |

---

## Projects

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/projects` | 👤 | Browse projects |
| GET | `/projects/{project_id}` | 👤 | Project detail |
| POST | `/projects` | 🔐 | Create project |
| PATCH | `/projects/{project_id}` | 🔐 | Update project |
| PATCH | `/projects/{project_id}/status` | 🔐 | Status transition |
| POST | `/projects/{project_id}/publish` | 🔐 | Publish project |
| GET | `/projects/{project_id}/history` | 🔐 | Status history |

---

## Applications & Proposals

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/applications` | 🔐 | Apply to project |
| GET | `/applications/mine` | 🔐 | My applications |
| GET | `/applications/project/{project_id}` | 🔐 | Project applications (owner) |
| DELETE | `/applications/{application_id}` | 🔐 | Withdraw application |
| PATCH | `/applications/{application_id}/status` | 🔐 | Accept/reject (client) |
| POST | `/proposals` | 🔐 | Alias: create application |
| GET | `/proposals/mine` | 🔐 | Alias: my applications |
| GET | `/proposals/project/{project_id}` | 🔐 | Alias: project proposals |
| PATCH | `/proposals/{application_id}/status` | 🔐 | Alias: update status |

---

## Companies

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/companies` | 🔓 | Published companies |
| GET | `/companies/{slug}` | 🔓 | Company by slug |
| GET | `/companies/me/list` | 🔐 | Owner's companies |
| POST | `/companies/me` | 🔐 | Create company |
| PATCH | `/companies/me/{company_id}` | 🔐 | Update company |

---

## Contracts

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/contracts` | 🔐 | List contracts |
| GET | `/contracts/{contract_id}` | 🔐 | Contract detail |
| PATCH | `/contracts/{contract_id}/status` | 🔐 | Status transition |
| POST | `/contracts/{contract_id}/fund` | 🔐 | Fund escrow |
| GET | `/contracts/{contract_id}/escrow` | 🔐 | Escrow transactions |
| POST | `/contracts/{contract_id}/files` | 🔐 | Upload project file |
| GET | `/contracts/{contract_id}/files` | 🔐 | List project files |
| POST | `/contracts/{contract_id}/reviews` | 🔐 | Submit project review |
| GET | `/contracts/{contract_id}/reviews` | 🔐 | List project reviews |

---

## Milestones

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/milestones/contract/{contract_id}` | 🔐 | Create milestone |
| GET | `/milestones/contract/{contract_id}` | 🔐 | List milestones |
| PATCH | `/milestones/{milestone_id}/status` | 🔐 | Update milestone status |

---

## Disputes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/disputes/contract/{contract_id}` | 🔐 | Open contract dispute |
| GET | `/disputes/order/{order_id}` | 🔐 | Dispute by order |
| GET | `/disputes/{dispute_id}` | 🔐 | Dispute detail |
| GET | `/disputes/{dispute_id}/messages` | 🔐 | Dispute messages |
| POST | `/disputes/{dispute_id}/messages` | 🔐 | Send dispute message |

---

## Conversations & Messages

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/conversations` | 🔐 | List chat threads |
| GET | `/conversations/{id}/messages` | 🔐 | Thread messages |
| POST | `/conversations/{id}/messages` | 🔐 | Send message |
| POST | `/conversations/{id}/read` | 🔐 | Mark thread read |
| GET | `/conversations/presence/me` | 🔐 | Own presence |
| PATCH | `/conversations/presence/me` | 🔐 | Update presence |
| GET | `/conversations/presence/{user_id}` | 🔐 | User presence |
| GET | `/messages/conversations` | 🔐 | Legacy conversation list |
| GET | `/messages/inbox` | 🔐 | Deduped inbox |
| GET | `/messages` | 🔐 | Messages list |
| POST | `/messages` | 🔐 | Send message (legacy) |

---

## Dashboard

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/dashboard/badges` | 🔐 | Badge counts |
| GET | `/dashboard/home` | 🔐 | Home dashboard data |
| GET | `/dashboard/overview` | 🔐 | Home + badges |
| GET | `/dashboard/summary` | 🔐 | Profile + wallet + stats |
| GET | `/dashboard/reviews` | 🔐 | Reviews page bundle |

---

## Calls

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/calls` | 🔐 | Start call session |
| GET | `/calls/{call_id}` | 🔐 | Call session detail |
| PATCH | `/calls/{call_id}` | 🔐 | Signaling/status update |

---

## Notifications

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/notifications/channels` | 🔓 | Enabled channels |
| GET | `/notifications` | 🔐 | List notifications |
| POST | `/notifications/mark-read` | 🔐 | Mark notification read |
| POST | `/notifications/dismiss` | 🔐 | Dismiss notification |
| POST | `/notifications/mark-all-read` | 🔐 | Mark all read |
| GET | `/notifications/telegram/link-token` | 🔐 | Telegram link token |
| POST | `/notifications/telegram/webhook` | 🔗 | Telegram bot webhook |

---

## Saved Items

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/saved-items` | 🔐 | Saved services |
| POST | `/saved-items` | 🔐 | Save service |
| DELETE | `/saved-items/{service_id}` | 🔐 | Unsave service |
| GET | `/saved-items/services/enriched` | 🔐 | Saved services (full) |
| GET | `/saved-items/freelancers` | 🔐 | Saved freelancers |
| POST | `/saved-items/freelancers` | 🔐 | Save freelancer |
| DELETE | `/saved-items/freelancers/{id}` | 🔐 | Unsave freelancer |
| GET | `/saved-items/freelancers/enriched` | 🔐 | Saved freelancers (full) |
| GET | `/saved-items/projects` | 🔐 | Saved projects |
| POST | `/saved-items/projects` | 🔐 | Save project |
| DELETE | `/saved-items/projects/{id}` | 🔐 | Unsave project |

---

## Reviews

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/reviews/recent` | 🔓 | Recent public reviews |
| GET | `/reviews/service/{service_id}` | 🔓 | Service reviews |
| GET | `/reviews/freelancer/{id}` | 🔓 | Freelancer reviews |
| GET | `/reviews/freelancer/{id}/stats` | 🔓 | Freelancer review stats |
| GET | `/reviews/reviewer/me` | 🔐 | Reviews I wrote |
| GET | `/reviews/reviewer/me/stats` | 🔐 | My review stats |
| GET | `/reviews/order/{order_id}` | 🔐 | Review for order |
| POST | `/reviews` | 🔐 | Create review |
| PATCH | `/reviews/{review_id}` | 🔐 | Edit review |
| PATCH | `/reviews/{review_id}/reply` | 🔐 | Freelancer reply |
| DELETE | `/reviews/{review_id}` | 🔐 | Delete review |

---

## Stats & Vacancies

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/stats/public` | 🔓 | Landing page statistics |
| GET | `/vacancies` | 🔓 | List vacancies |
| GET | `/vacancies/{vacancy_id}` | 👤 | Vacancy detail |
| POST | `/vacancies` | 🔐 | Create vacancy |
| POST | `/vacancies/{vacancy_id}/apply` | 🔐 | Apply to vacancy |

---

## Waitlist & AI

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/waitlist` | 🔓 | Join email waitlist |
| POST | `/ai/suggest` | 🔐 | Template-based text suggestions |

---

## Platform

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/platform/activities` | 🔐 | User activity log |
| GET | `/platform/activity-feed` | 🔐 | Merged activity feed |
| GET | `/platform/reputation/{user_id}` | 🔓 | User reputation |
| GET | `/platform/reputation/me` | 🔐 | Own reputation |
| POST | `/platform/verifications` | 🔐 | Submit verification |
| GET | `/platform/verifications` | 🔐 | List verifications |
| POST | `/platform/reports` | 🔐 | Submit report |
| GET | `/platform/reports` | 🔐 | List reports |
| GET | `/platform/reports/{id}/messages` | 🔐 | Report messages |
| POST | `/platform/reports/{id}/messages` | 🔐 | Send report message |
| GET | `/platform/drafts/{key}` | 🔐 | Get form draft |
| PUT | `/platform/drafts/{key}` | 🔐 | Save form draft |
| DELETE | `/platform/drafts/{key}` | 🔐 | Delete draft |
| POST | `/platform/analytics/funnel` | 👤 | Funnel event |
| POST | `/platform/analytics/track` | 👤 | Analytics event |
| POST | `/platform/storage/signed-url` | 🔐 | Storage signed URL |
| GET | `/platform/feature-flags` | 🔓 | Feature flags |
| POST | `/platform/audit/login` | 🔐 | Login audit (authed) |
| POST | `/platform/audit/register` | 🔐 | Register audit |
| POST | `/platform/client-errors` | 👤 | Client error report |
| GET | `/platform/request-audit/top` | 🔐 | DB request stats (admin in prod) |
| POST | `/platform/request-audit/reset` | 🔐 | Reset request stats |

---

## Trust

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/trust/buyer-protection` | 🔓 | Buyer protection info |
| GET | `/trust/dispute-stats/public` | 🔓 | Public dispute stats |
| GET | `/trust/terms/current` | 🔓 | Current terms document |
| POST | `/trust/terms/consent` | 🔐 | Record terms consent |
| GET | `/trust/terms/consent/status` | 🔐 | Consent status |
| GET | `/trust/reputation/me/breakdown` | 🔐 | Own trust breakdown |
| GET | `/trust/reputation/{user_id}/breakdown` | 🔓 | User trust breakdown |
| GET | `/trust/ledger/me` | 🔐 | Financial ledger |
| GET | `/trust/bank-accounts` | 🔐 | List bank accounts |
| POST | `/trust/bank-accounts` | 🔐 | Add bank account |
| GET | `/trust/receipts/order/{order_id}` | 🔐 | Payment receipt |
| GET | `/trust/receipts/order/{order_id}/pdf` | 🔐 | Receipt PDF |
| POST | `/trust/companies/{company_id}/stir` | 🔐 | Submit company STIR |
| POST | `/trust/jobs/run` | ⏰ | Cron: escrow auto-release + dispute SLA |
| POST | `/trust/jobs/backup-checkpoint` | ⏰ | Cron: backup checkpoint |

---

## Security

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/security/phone/send` | 🔐 | Send phone OTP |
| POST | `/security/phone/verify` | 🔐 | Verify phone OTP |
| GET | `/security/events/me` | 🔐 | Security event log |
| POST | `/security/audit/login` | 🔓 | Anonymous login audit (+ Turnstile) |
| POST | `/security/audit/login-authed` | 🔐 | Authed login audit |

---

## Admin

All endpoints require 🛡️ Admin JWT with minimum role as noted.

| Method | Path | Min role | Description |
|--------|------|----------|-------------|
| GET | `/admin/stats` | moderator | Dashboard stats |
| GET | `/admin/overview` | moderator | Admin overview |
| GET | `/admin/users` | moderator | Paginated users |
| GET | `/admin/users/{target_id}` | moderator | User detail |
| PATCH | `/admin/users/{target_id}` | admin | Update user |
| PATCH | `/admin/users/{target_user_id}/suspend` | admin | Suspend user |
| POST | `/admin/users/bulk` | admin | Bulk user actions |
| POST | `/admin/users/bulk-notify` | admin | Bulk notify |
| GET | `/admin/orders` | moderator | Paginated orders |
| PATCH | `/admin/orders/{order_id}/status` | admin | Override order status |
| POST | `/admin/orders/bulk` | admin | Bulk order actions |
| GET | `/admin/services` | moderator | List services |
| PATCH | `/admin/services/{service_id}` | moderator | Update service |
| DELETE | `/admin/services/{service_id}` | admin | Delete service |
| GET | `/admin/services/moderation-queue` | moderator | Moderation queue |
| PATCH | `/admin/services/{service_id}/moderation` | moderator | Moderate service |
| GET | `/admin/disputes` | moderator | Order disputes |
| GET | `/admin/contract-disputes` | moderator | Contract disputes |
| GET | `/admin/disputes-overview` | moderator | Disputes overview |
| PATCH | `/admin/disputes/{dispute_id}/resolve` | admin | Resolve dispute |
| GET | `/admin/withdrawals` | admin | Withdrawal requests |
| PATCH | `/admin/withdrawals/{request_id}` | admin | Process withdrawal |
| GET | `/admin/escrow` | admin | Escrow transactions |
| GET | `/admin/escrow/summary` | admin | Escrow summary |
| GET | `/admin/escrow/auto-releases` | admin | Auto-release queue |
| GET | `/admin/milestones` | moderator | Milestones list |
| GET | `/admin/waitlist` | moderator | Waitlist emails |
| GET | `/admin/fraud-center` | admin | Fraud dashboard |
| GET | `/admin/fraud-logs` | admin | Fraud logs |
| PATCH | `/admin/fraud-logs/{log_id}/resolve` | admin | Resolve fraud log |
| GET | `/admin/activity-feed` | moderator | Platform activity |
| GET | `/admin/audit-logs` | admin | Audit logs |
| GET | `/admin/analytics` | moderator | Admin analytics |
| GET | `/admin/reports` | moderator | User reports |
| PATCH | `/admin/reports/{report_id}/status` | moderator | Update report |
| POST | `/admin/reports/{report_id}/messages` | moderator | Reply to report |
| GET | `/admin/verifications` | moderator | Verification queue |
| PATCH | `/admin/verifications/{verification_id}` | moderator | Review verification |
| GET | `/admin/moderation-actions` | moderator | Moderation history |
| GET | `/admin/backups` | admin | Backup metadata |
| POST | `/admin/backups` | admin | Create backup record |
| GET | `/admin/feature-flags` | admin | Feature flags |
| PATCH | `/admin/feature-flags` | admin | Update feature flag |
| POST | `/admin/notifications/broadcast` | admin | Broadcast notification |
| GET | `/admin/companies` | moderator | Companies list |
| POST | `/admin/companies` | admin | Create company |
| PATCH | `/admin/companies/{id}` | admin | Update company |
| GET | `/admin/compliance-flags` | admin | Compliance flags |
| PATCH | `/admin/compliance-flags/{id}` | admin | Update compliance flag |
| GET | `/admin/bank-accounts` | admin | Bank accounts |
| PATCH | `/admin/bank-accounts/{id}` | admin | Verify bank account |
| POST | `/admin/trust-jobs/run` | admin | Manual trust job run |

---

## Related documents

- [API.md](./API.md)
- [WEBHOOKS.md](./WEBHOOKS.md)
- [AUTHENTICATION.md](./AUTHENTICATION.md)
