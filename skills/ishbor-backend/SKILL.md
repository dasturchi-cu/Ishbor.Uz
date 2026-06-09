---
name: ishbor-backend
description: IshBor.uz backend API, Prisma, auth va to'lov integratsiyasi. Use when creating API routes, database schema, Click/Payme payments, escrow, or NestJS/Prisma setup.
---

# IshBor Backend Skill

## O'qish tartibi (kod yozishdan oldin)
1. [AGENTS.md](../../AGENTS.md)
2. [plan-status.md](../../plan-status.md)
3. [mvp.md](../../mvp.md)
4. `.cursor/rules/backend-api.mdc`
5. [docs/actionable-backlog.md](../../docs/actionable-backlog.md) — API↔UI bo'shliqlar

## Maqsad
Frontend prototipni haqiqiy backend bilan ulash.

## Prisma schema (minimal)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  role      Role     @default(FREELANCER)
  createdAt DateTime @default(now())
  freelancerProfile FreelancerProfile?
  clientProfile     ClientProfile?
}

enum Role {
  FREELANCER
  CLIENT
}

model Service {
  id          String   @id @default(cuid())
  title       String
  description String
  price       Int      // so'm
  category    String
  region      String
  freelancerId String
  createdAt   DateTime @default(now())
}

model Order {
  id         String      @id @default(cuid())
  serviceId  String?
  clientId   String
  freelancerId String
  amount     Int
  status     OrderStatus @default(PENDING)
  createdAt  DateTime    @default(now())
}

enum OrderStatus {
  PENDING
  ACTIVE
  DELIVERED
  COMPLETED
  DISPUTED
  CANCELLED
}
```

## Auth pattern (Next.js Route Handler)

```typescript
// app/api/auth/login/route.ts
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { signToken } from '@/lib/auth'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(req: Request) {
  const body = schema.parse(await req.json())
  // verify user, return JWT cookie
}
```

## Click to'lov (MVP)
1. Merchant ariza: merchant.click.uz
2. `POST /api/payments/click/prepare`
3. Webhook: `POST /api/payments/click/complete`
4. Escrow: transaction + escrow_hold yaratish

## Env o'zgaruvchilar
```
DATABASE_URL=
JWT_SECRET=
CLICK_MERCHANT_ID=
CLICK_SERVICE_ID=
CLICK_SECRET_KEY=
```

## Xavfsizlik
- `.env` gitignore da
- Parol hash, plain text saqlama
- Rate limit login endpoint

## Keyingi qadam
To'liq MVP: [mvp.md](../../mvp.md) Bosqich 1–5
