# IshBor.uz — To'liq Ishlab Chiqish Rejasi

> **Versiya:** 2.0 (2026-06)  
> **Bog'liq hujjatlar:** [mvp.md](./mvp.md) · [plan-status.md](./plan-status.md) · [AGENTS.md](./AGENTS.md) · [.cursor/README.md](./.cursor/README.md)

---

## Mundarija

1. [Loyiha haqida](#1-loyiha-haqida)
2. [Bozor va raqobat](#2-bozor-va-raqobat)
3. [Texnologik stack](#3-texnologik-stack)
4. [Arxitektura (Clean Architecture)](#4-arkitektura-clean-architecture)
5. [Hozirgi holat](#5-hozirgi-holat)
6. [MVP — Bosqich 1](#6-mvp--bosqich-1)
7. [Bosqich 2 — Kengaytirish](#7-bosqich-2--kengaytirish)
8. [Bosqich 3 — 20 ta qo'shimcha feature](#8-bosqich-3--20-ta-qoshimcha-feature)
9. [URL struktura (reja)](#9-url-struktura-reja)
10. [Monetizatsiya](#10-monetizatsiya)
11. [Xavfsizlik](#11-xavfsizlik)
12. [Timeline](#12-timeline)

---

## 1. Loyiha haqida

**IshBor.uz** — O'zbekiston uchun freelance marketplace platformasi. Maqsad: Kwork, Upwork va Fiverr ning mahalliy alternativi.

| Parametr | Qiymat |
|----------|--------|
| Domen | ishbor.uz |
| Maqsadli auditoriya | Freelancerlar, Kichik biznes, Startaplar |
| Asosiy tillar | O'zbek (default), Rus, Ingliz |
| To'lov | Click, Payme, Uzcard (keyinchalik) |
| Valyuta | O'zbek so'mi (UZS) |

**Asosiy qiymat taklifi:**
- Freelancerlar xizmat e'lon qiladi va daromad topadi
- Mijozlar tez va ishonchli mutaxassis topadi
- Platforma escrow orqali xavfsiz to'lov ta'minlaydi

---

## 2. Bozor va raqobat

### O'zbekiston bozori

| Ko'rsatkich | Qiymat |
|-------------|--------|
| Aholisi | ~37 mln |
| Internet foydalanuvchilari | ~22 mln |
| IT sektor o'sishi | ~25% yillik |
| Freelance bozor hajmi | $50–100 mln (taxmin) |

### Raqobatchilar

| Platforma | Kuchli tomoni | Zaif tomoni |
|-----------|---------------|-------------|
| Upwork / Fiverr | Global, katta auditoriya | O'zbek tilida emas, mahalliy to'lov yo'q |
| Kwork | Arzon, sodda | Faqat rus tilida |
| OLX / Telegram | Mahalliy, tez | Professional emas, escrow yo'q |
| **IshBor.uz** | UZ/RU/EN, Click/Payme, escrow | Hali ishlab chiqilmoqda |

---

## 3. Texnologik stack

| Qatlam | Texnologiya | Izoh |
|--------|-------------|------|
| Frontend | Next.js **16**, React 19, TypeScript | App Router (keyingi bosqich) |
| UI | Tailwind CSS 4, shadcn/ui | Design system tayyor |
| Backend | Next.js Route Handlers yoki NestJS | MVP da tanlanadi |
| Database | PostgreSQL + Prisma ORM | Hali yo'q |
| Auth | JWT (httpOnly cookie) | Hali mock |
| File storage | Cloudflare R2 / AWS S3 | Keyin |
| Real-time | Socket.io yoki Pusher | Chat uchun |
| To'lov | Click API, Payme API | Escrow bilan |
| Deploy | Vercel (frontend) + Railway/Supabase (DB) | — |
| Fontlar | Plus Jakarta Sans + Inter | Rejada Bricolage/DM Sans edi — almashtirildi |

---

## 4. Arxitektura (Clean Architecture)

Loyiha **Clean Architecture** prinsiplari bo'yicha qayta tuzildi:

```
app/                          # Next.js — faqat entry (layout, page, globals.css)
src/
├── domain/                   # Biznes qoidalari (framework dan mustaqil)
│   ├── entities/             # User, Service, Order, ... tiplar
│   └── constants/            # regions.ts, routes.ts
├── application/              # Use case va ilova holati
│   └── providers/            # AppProvider (theme, i18n, auth state)
├── infrastructure/           # Tashqi dunyo bilan aloqa
│   ├── i18n/                 # Tarjimalar (UZ/RU/EN)
│   ├── mock/                 # Demo ma'lumotlar (vaqtinchalik)
│   └── repositories/         # Kelajakda: Prisma, API client
├── presentation/             # UI qatlami
│   ├── components/
│   │   ├── ui/               # shadcn (Button, Card, Input)
│   │   ├── layout/           # Navbar, Footer
│   ├── features/             # Feature-based sahifalar
│   │   ├── auth/
│   │   ├── landing/
│   │   ├── dashboard/
│   │   ├── catalog/
│   │   ├── profile/
│   │   ├── project/
│   │   ├── chat/
│   │   └── wallet/
│   └── pages/                # PageContent (SPA router shell)
└── shared/
    └── lib/                  # utils (cn, helpers)
```

**Import qoidalari:**

| Eski yo'l | Yangi yo'l |
|-----------|------------|
| `@/lib/i18n` | `@/infrastructure/i18n` |
| `@/lib/regions` | `@/domain/constants/regions` |
| `@/lib/types` | `@/domain/entities` |
| `@/lib/mock-data` | `@/infrastructure/mock/mock-data` |
| `@/lib/utils` | `@/shared/lib/utils` |
| `@/components/ui/*` | `@/presentation/components/ui/*` |

**Qatlamlar o'rtasidagi bog'liqlik:**

```
presentation → application → domain
infrastructure → domain
presentation ↛ infrastructure (to'g'ridan-to'g'ri emas — kelajakda repository interface orqali)
```

---

## 5. Hozirgi holat

> Batafsil: [plan-status.md](./plan-status.md)

| Bo'lim | Holat | Foiz |
|--------|-------|------|
| Frontend UI (11 sahifa) | ✅ Tayyor | ~85% |
| i18n (UZ/RU/EN) | ✅ Tayyor | ~85% |
| Clean Architecture | ✅ Qayta tuzildi | 100% |
| Design system | ✅ Tailwind + shadcn | ~90% |
| Viloyatlar (14 ta) | ✅ | 100% |
| URL routing (App Router) | ❌ | 0% |
| Backend / API | ❌ | 0% |
| Database (Prisma) | ❌ | 0% |
| Auth (JWT) | ❌ Mock | 0% |
| To'lov (Click/Payme) | ❌ | 0% |
| Escrow | ❌ | 0% |
| Real-time chat | ❌ Mock | 0% |
| Admin panel | ❌ | 0% |

**Umumiy tayyorgarlik:** UI ~40%, backend 0% — **MVP ishga tushirishga tayyor emas**.

### Hal qilingan muammolar (2026-06)

- ✅ Barcha UI matnlar i18n orqali (UZ/RU/EN)
- ✅ Register formada select ko'rinmasligi (`.select-auth`)
- ✅ 14 viloyat dropdown'larda
- ✅ Eski `-premium` nomlari tozalandi
- ✅ Clean Architecture `src/` struktura

### Qolgan muammolar

| # | Muammo | Ustuvorlik |
|---|--------|------------|
| 1 | Backend yo'q | 🔴 Kritik |
| 2 | Mock auth | 🔴 Kritik |
| 3 | URL routing yo'q | 🔴 Kritik |
| 4 | To'lov yo'q | 🔴 Kritik |
| 5 | Footer `href="#"` | 🟡 O'rta |
| 6 | Mock data inglizcha ismlar | 🟢 Past |

---

## 6. MVP — Bosqich 1

> To'liq MVP rejasi: [mvp.md](./mvp.md) (8–12 hafta)

### Maqsad

Real foydalanuvchilar bilan ishlaydigan minimal marketplace: ro'yxatdan o'tish → xizmat → buyurtma → to'lov → sharh.

### Checklist

#### Infrastruktura
- [x] Frontend UI prototip (11 sahifa)
- [x] i18n (UZ/RU/EN)
- [x] Design system
- [x] Clean Architecture tuzilma
- [ ] App Router — har sahifa alohida URL
- [ ] PostgreSQL + Prisma schema
- [ ] Auth API (JWT)
- [ ] CI/CD (GitHub Actions)

#### Foydalanuvchi
- [ ] Rol: freelancer / client
- [ ] Profil CRUD
- [ ] Email tasdiqlash
- [ ] Parol tiklash

#### Xizmatlar
- [ ] Xizmat yaratish / tahrirlash
- [ ] Katalog — haqiqiy DB
- [ ] Filtr: kategoriya, narx, viloyat, reyting

#### Buyurtma
- [ ] Buyurtma flow: `pending → active → delivered → completed`
- [ ] Nizo (dispute) — minimal

#### To'lov
- [ ] Click **yoki** Payme integratsiya
- [ ] Escrow hold
- [ ] Pul yechish so'rovi

#### Chat va Admin
- [ ] Buyurtma bo'yicha xabarlar
- [ ] Minimal admin panel
- [ ] Beta test (100 user)

---

## 7. Bosqich 2 — Kengaytirish

MVP ishga tushgandan keyin (3–6 oy):

| # | Feature | Ta'rif |
|---|---------|--------|
| 1 | App Router to'liq | SEO, share, bookmark |
| 2 | React Query | Server state boshqaruvi |
| 3 | Zod validatsiya | Forma xavfsizligi |
| 4 | Email/SMS | Resend + Eskiz.uz |
| 5 | Push bildirishnomalar | Web Push API |
| 6 | Reyting tizimi | 5 yulduz + sharh |
| 7 | Kategoriya daraxti | Nested categories |
| 8 | Qidiruv (Elasticsearch) | To'liq matn qidiruv |
| 9 | Admin analytics | Dashboard statistika |
| 10 | E2E testlar | Playwright |

---

## 8. Bosqich 3 — 20 ta qo'shimcha feature

MVP + Bosqich 2 dan keyin (6–18 oy):

| # | Feature | Texnologiya | Biznes qiymati |
|---|---------|-------------|----------------|
| 1 | **AI loyiha tavsifi** | Claude API | Mijozlar tezroq loyiha yaratadi |
| 2 | **Telegram bot** | @IshBorBot, grammY | Bildirishnomalar, tez kirish |
| 3 | **Ko'nikma testlari** | Custom quiz engine | "Tasdiqlangan mutaxassis" badge |
| 4 | **Video portfolyo** | Cloudflare Stream | 60 soniyalik intro video |
| 5 | **Video qo'ng'iroq** | WebRTC / Daily.co | Mijoz-freelancer uchrashuv |
| 6 | **Avtomatik shartnoma** | PDF generator + imzo | Huquqiy himoya |
| 7 | **Viloyat xaritasi** | Mapbox / Leaflet | Interaktiv O'zbekiston xaritasi |
| 8 | **Referral dastur** | Unique link + bonus | Viral o'sish |
| 9 | **Pro/Business obuna** | Stripe Billing / mahalliy | Doimiy daromad |
| 10 | **Mobil ilova** | React Native / Expo | iOS + Android |
| 11 | **Korporativ akkaunt** | Team management | Katta mijozlar |
| 12 | **Dispute resolution** | Admin panel + workflow | Nizo hal qilish |
| 13 | **Fraud detection** | Rule engine + ML | Shubhali tranzaksiya |
| 14 | **Freelancer akademiyasi** | LMS moduli | Kurslar, sertifikatlar |
| 15 | **SEO blog** | MDX + CMS | "Freelance O'zbekiston" trafik |
| 16 | **Ochiq statistika widget** | Real-time counter | "Bugun X ta buyurtma" — ishonch |
| 17 | **AI freelancer matching** | Embedding + Claude | Aqlli tavsiya |
| 18 | **Milestone to'lov** | Escrow bosqichlari | Katta loyihalar |
| 19 | **API marketplace** | REST API + widget | Tashqi saytlar integratsiyasi |
| 20 | **QZ/KG kengaytmasi** | i18n + mahalliy to'lov | Markaziy Osiyo bozori |

---

## 9. URL struktura (reja)

Hozir barcha sahifalar `/` da React state bilan. Keyingi bosqich:

| URL | Sahifa | Auth |
|-----|--------|------|
| `/` | Landing | Yo'q |
| `/register` | Ro'yxatdan o'tish | Yo'q |
| `/login` | Kirish | Yo'q |
| `/services` | Xizmatlar katalogi | Yo'q |
| `/freelancer/[id]` | Freelancer profili | Yo'q |
| `/dashboard` | Freelancer dashboard | ✅ |
| `/client/dashboard` | Mijoz dashboard | ✅ |
| `/post-project` | Loyiha joylash | ✅ |
| `/messages` | Xabarlar | ✅ |
| `/wallet` | Hamyon | ✅ |
| `/settings` | Profil sozlamalari | ✅ |
| `/admin` | Admin panel | Admin |

---

## 10. Monetizatsiya

| Model | Foiz / Narx | Qachon |
|-------|-------------|--------|
| Komissiya | 10–15% har buyurtmadan | MVP |
| Pro obuna | ~99 000 so'm/oy | Bosqich 3 |
| Business obuna | ~499 000 so'm/oy | Bosqich 3 |
| Featured listing | ~50 000 so'm/hafta | Bosqich 2 |
| Reklama | Banner, sponsored | Bosqich 3 |

---

## 11. Xavfsizlik

- JWT httpOnly cookie (XSS himoya)
- Rate limiting (API)
- CSRF token
- Escrow — pul platformada saqlanadi
- 2FA (keyinchalik)
- KYC — yirik pul yechish uchun (keyinchalik)

---

## 12. Timeline

```
2026 Q2  ████████░░░░░░░░  UI prototip + Clean Architecture  ← HOZIR
2026 Q3  ░░░░░░░░░░░░░░░░  MVP (backend, auth, to'lov)
2026 Q4  ░░░░░░░░░░░░░░░░  Beta launch (100 user)
2027 Q1  ░░░░░░░░░░░░░░░░  Bosqich 2 (SEO, analytics, testlar)
2027 Q2+ ░░░░░░░░░░░░░░░░  Bosqich 3 (20 feature, mobil, AI)
```

---

## Tez havolalar

| Hujjat | Maqsad |
|--------|--------|
| [mvp.md](./mvp.md) | 8 haftalik MVP sprint |
| [plan-status.md](./plan-status.md) | Reja vs haqiqat, kamchiliklar |
| [.cursor/AGENTS.md](./.cursor/AGENTS.md) | Cursor agent yo'riqnomasi |
| [README.md](./README.md) | Loyihani ishga tushirish |

---

*Oxirgi yangilanish: 2026-06-07*
