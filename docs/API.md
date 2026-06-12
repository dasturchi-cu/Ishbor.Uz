# API Overview

REST API for IshBor.uz business logic, served by FastAPI.

---

## Base information

| Property | Value |
|----------|-------|
| **Base URL (production)** | `https://api.ishbor.uz/api/v1` |
| **Base URL (development)** | `http://127.0.0.1:8002/api/v1` |
| **Protocol** | HTTPS (production), HTTP (local) |
| **Format** | JSON |
| **Version** | v1 |
| **OpenAPI** | `/docs` (when `DOCS_ENABLED=true`) |

Frontend proxies API requests via `NEXT_PUBLIC_API_URL` in development.

---

## Authentication

All protected endpoints require:

```http
Authorization: Bearer <supabase_access_token>
```

Obtain the token from Supabase Auth (`signInWithPassword`, OAuth, etc.).

### Auth levels

| Level | Description |
|-------|-------------|
| **Public** | No token required |
| **Optional** | Token used if present (e.g., view tracking) |
| **Authenticated** | Valid JWT + not banned/suspended |
| **Admin** | JWT + `profiles.is_admin` + role hierarchy |

### Error responses

| Status | Meaning |
|--------|---------|
| `401` | Missing or invalid token |
| `403` | Forbidden (role, ban, ownership) |
| `404` | Resource not found |
| `422` | Validation error |
| `429` | Rate limit exceeded |
| `500` | Internal server error |

```json
{
  "detail": "Human-readable error message"
}
```

---

## Request conventions

### Pagination

List endpoints accept:

| Param | Type | Default |
|-------|------|---------|
| `page` | int | 1 |
| `page_size` | int | 20 (max 100) |

Response envelope:

```json
{
  "items": [],
  "total": 150,
  "page": 1,
  "page_size": 20,
  "pages": 8
}
```

### Idempotency

For payment and financial mutations, include:

```http
Idempotency-Key: <unique-uuid>
```

Duplicate keys return the original response within TTL.

### Filtering & sorting

Catalog endpoints support query params:

```
GET /api/v1/services?category=design&region=tashkent&sort=rating&page=1
```

---

## Router map

| Prefix | Router | Auth | Description |
|--------|--------|------|-------------|
| `/health` | health | Public | Liveness, readiness |
| `/profiles` | profiles | Mixed | User profiles |
| `/services` | services | Mixed | Service catalog & CRUD |
| `/orders` | orders | Auth | Gig orders |
| `/payments` | payments | Mixed | Checkout, wallet, webhooks |
| `/projects` | projects | Mixed | Project postings |
| `/applications` | applications | Auth | Project applications |
| `/proposals` | proposals | Auth | Alias for applications |
| `/companies` | companies | Mixed | Company profiles |
| `/contracts` | contracts | Auth | Project contracts |
| `/milestones` | milestones | Auth | Contract milestones |
| `/disputes` | disputes | Auth | Order/contract disputes |
| `/conversations` | conversations | Auth | Chat threads |
| `/messages` | messages | Auth | Legacy order messaging |
| `/dashboard` | dashboard | Auth | Dashboard aggregates |
| `/calls` | calls | Auth | WebRTC call sessions |
| `/notifications` | notifications | Mixed | In-app notifications |
| `/saved-items` | saved_items | Auth | Bookmarks |
| `/reviews` | reviews | Mixed | Ratings & reviews |
| `/stats` | stats | Public | Landing statistics |
| `/vacancies` | vacancies | Mixed | Job vacancies |
| `/waitlist` | waitlist | Public | Email waitlist |
| `/ai` | ai | Auth | Text suggestions |
| `/platform` | platform | Mixed | Analytics, drafts, flags |
| `/trust` | trust | Mixed | Trust, receipts, cron jobs |
| `/security` | security | Mixed | Phone OTP, audit |
| `/admin` | admin | Admin | Platform administration |

---

## Health endpoints

```http
GET /api/v1/health
GET /api/v1/health/live
GET /api/v1/health/ready
```

`/health/ready` checks database connectivity, migration status, and payment config.

---

## Rate limiting

| Scope | Limit |
|-------|-------|
| Anonymous | 60 req/min per IP |
| Authenticated | 120 req/min per user |
| Payment checkout | 10 req/min per user |
| Webhooks | Provider-specific |

Backend: Redis (`REDIS_URL`) or Postgres fallback.

---

## CORS

Allowed origins configured via `CORS_ORIGINS` (comma-separated).

Development default: `http://localhost:3000`

---

## Webhooks

Payment and external service webhooks are documented in [WEBHOOKS.md](./WEBHOOKS.md).

| Endpoint | Provider |
|----------|----------|
| `POST /payments/webhooks/click/prepare` | Click |
| `POST /payments/webhooks/click/complete` | Click |
| `POST /payments/webhooks/payme` | Payme |
| `POST /notifications/telegram/webhook` | Telegram |

---

## Client SDK usage

Frontend uses typed methods in `src/infrastructure/api/client.ts`:

```typescript
import { api } from '@/infrastructure/api/client';

const profile = await api.getProfile();
const orders = await api.listOrders({ page: 1 });
const checkout = await api.checkoutOrder(orderId, { provider: 'sandbox' });
```

---

## Full endpoint reference

See [API_REFERENCE.md](./API_REFERENCE.md) for the complete endpoint table.

---

## Related documents

- [API_REFERENCE.md](./API_REFERENCE.md)
- [WEBHOOKS.md](./WEBHOOKS.md)
- [AUTHENTICATION.md](./AUTHENTICATION.md)
- [AUTHORIZATION.md](./AUTHORIZATION.md)
