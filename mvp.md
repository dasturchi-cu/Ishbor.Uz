# IshBor.uz — MVP Rejasi

> **Maqsad:** Real foydalanuvchilar bilan ishlaydigan, pul o'tkazish va buyurtma jarayonini qamrab oladigan minimal mahsulot.
> **Muddat:** 8–12 hafta (1 full-stack + 1 dizayner/qo'llab-quvvatlash)
> **Hozirgi holat:** UI prototip (~40% frontend), backend 0%

---

## MVP nima?

MVP — **ishlaydigan marketplace**, faqat chiroyli landing emas:

1. Ro'yxatdan o'tish / kirish (haqiqiy)
2. Freelancer xizmat e'lon qiladi
3. Mijoz xizmat yoki loyiha buyurtma qiladi
4. To'lov escrow'ga tushadi
5. Ish bajariladi → pul freelancer'ga o'tadi
6. Sharh qoldiriladi

---

## Hozir nima tayyor? (2026-06)

| Bo'lim | Holat | Izoh |
|--------|-------|------|
| Landing UI | ✅ 90% | Marketing sahifa, i18n UZ |
| Register/Login UI | ✅ 80% | Faqat UI, auth yo'q |
| 11 sahifa UI | ✅ 70% | Mock data bilan |
| i18n (UZ/RU/EN) | ✅ 85% | `src/infrastructure/i18n/` |
| Viloyatlar ro'yxati | ✅ | `src/domain/constants/regions.ts` (14 ta) |
| URL routing | ❌ | Hammasi `/` da state bilan |
| Backend / API | ❌ | Yo'q |
| Database | ❌ | Prisma schema yo'q |
| Auth (JWT) | ❌ | `setIsLoggedIn(true)` mock |
| Click/Payme | ❌ | Yo'q |
| Escrow | ❌ | Yo'q |
| Real-time chat | ❌ | Mock data |
| Admin panel | ❌ | Yo'q |
| Email/SMS | ❌ | Yo'q |

---

## MVP scope — IN (qilish kerak)

### 1. Infrastruktura (1–2 hafta)
- [ ] Next.js App Router — har sahifa alohida URL (`/login`, `/services`, `/dashboard`)
- [ ] PostgreSQL + Prisma schema
- [ ] NestJS yoki Next.js Route Handlers (API)
- [ ] JWT auth (register, login, refresh)
- [ ] S3/R2 file upload (avatar)
- [ ] Staging + production (Vercel + Railway/Supabase)
- [ ] GitHub Actions CI (lint, build, test)

### 2. Foydalanuvchi (1 hafta)
- [ ] Rol: freelancer / client
- [ ] Profil CRUD (ism, bio, viloyat, mutaxassislik)
- [ ] Email tasdiqlash
- [ ] Parol tiklash

### 3. Xizmatlar (1–2 hafta)
- [ ] Xizmat yaratish (narx, tavsif, kategoriya, muddat)
- [ ] Xizmatlar katalogi — haqiqiy DB dan
- [ ] Filtr: kategoriya, narx, viloyat, reyting
- [ ] Freelancer profil sahifasi (`/freelancer/[id]`)

### 4. Buyurtma (1–2 hafta)
- [ ] Buyurtma yaratish (xizmatdan yoki loyihadan)
- [ ] Status: `pending → active → delivered → completed / disputed`
- [ ] Mijoz ishni qabul qiladi yoki qayta ishlash so'raydi
- [ ] Buyurtma tarixi

### 5. To'lov — MVP minimum (2 hafta)
- [ ] Click **yoki** Payme (bittasi yetarli MVP uchun)
- [ ] Escrow hold — pul platformada saqlanadi
- [ ] Ish tasdiqlanganda pul freelancer balansiga
- [ ] Pul yechish so'rovi (manual admin tasdiqlash MVP da OK)

### 6. Chat (1 hafta)
- [ ] Buyurtma bo'yicha xabarlar (REST polling yoki Socket.io)
- [ ] Fayl yuborish (rasm, hujjat)

### 7. Reyting (3 kun)
- [ ] Buyurtma tugagach sharh (1–5 yulduz + matn)
- [ ] Freelancer o'rtacha reytingi

### 8. Admin — minimal (1 hafta)
- [ ] Foydalanuvchilar ro'yxati
- [ ] Buyurtmalar monitoring
- [ ] Pul yechish so'rovlarini tasdiqlash
- [ ] Shikoyatlar (flag)

### 9. MVP launch checklist
- [ ] 50 beta foydalanuvchi
- [ ] Privacy Policy + Terms (o'zbekcha)
- [ ] Sentry xato monitoring
- [ ] Mobile responsive test
- [ ] Performance: LCP < 2.5s

---

## MVP scope — OUT (keyinroq)

Quyidagilar **MVP dan tashqari** (2-bosqich):

- AI loyiha yordamchisi
- Video qo'ng'iroq (WebRTC)
- Avtomatik PDF shartnoma
- Ko'nikma testlari
- Telegram bot
- Mobil ilova
- Obuna tizimi (Pro/Business)
- Stripe / xorijiy kartalar
- Referral dastur
- Viloyat xaritasi
- Fraud detection ML

---

## Texnik stack (MVP)

```
Frontend:  Next.js 16 + TypeScript + Tailwind + shadcn/ui
Backend:   Next.js API Routes yoki NestJS (alohida repo)
DB:        PostgreSQL + Prisma
Cache:     Redis (session, rate limit)
Auth:      JWT + httpOnly cookie
Files:     Cloudflare R2
Payments:  Click Merchant API v2
Deploy:    Vercel (front) + Railway (API/DB)
Monitor:   Sentry
```

---

## Database — MVP jadvallar

```
users
freelancer_profiles
client_profiles
services
orders
order_messages
transactions
escrow_holds
withdrawals
reviews
categories
notifications
```

To'liq schema: `plan.md` bo'lim 5 + keyinroq `prisma/schema.prisma`

---

## 8 haftalik sprint rejasi

| Hafta | Vazifa | Natija |
|-------|--------|--------|
| 1 | Routing + Prisma + Auth API | `/login` ishlaydi |
| 2 | Profil + xizmat CRUD | Freelancer xizmat qo'shadi |
| 3 | Katalog + qidiruv + profil | `/services`, `/freelancer/[id]` |
| 4 | Buyurtma flow | Buyurtma yaratish → qabul |
| 5 | Click integratsiya + escrow | To'lov ishlaydi |
| 6 | Chat + bildirishnomalar | Buyurtma chat |
| 7 | Admin + pul yechish + sharh | Admin panel |
| 8 | Test, bug fix, beta launch | 50 user |

---

## MVP muvaffaqiyat metrikalari

| Metrika | 1-oy maqsad |
|---------|-------------|
| Ro'yxatdan o'tganlar | 200+ |
| Faol freelancerlar | 50+ |
| Buyurtmalar | 30+ |
| Muvaffaqiyatli to'lovlar | 20+ |
| O'rtacha buyurtma | 500,000+ so'm |

---

## Keyingi qadam (bugun)

1. `npx create-next-app` routing refactor — SPA state o'rniga URL
2. `prisma init` + schema yozish
3. Auth API: `POST /api/auth/register`, `POST /api/auth/login`
4. Click Merchant arizasi yuborish

---

*Batafsil strategiya: [plan.md](./plan.md)*
*Cursor AI yo'riqnomasi: [.cursor/AGENTS.md](./.cursor/AGENTS.md)*
