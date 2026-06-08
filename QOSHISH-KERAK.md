# IshBor.uz — qayerda nima qo‘shish kerak

Lokal, Supabase, backend host, Vercel va GitHub bo‘yicha to‘liq checklist.  
✅ = odatda allaqachon qilingan | ⬜ = sizda tekshirish/qo‘shish kerak

---

## 1. Lokal kompyuter (development)

### Fayllar

| Fayl | Holat | Nima qo‘yish kerak |
|------|-------|-------------------|
| `.env.local` | ⬜ | Supabase URL + anon/publishable key, API URL |
| `backend/.env` | ⬜ | `SUPABASE_URL`, `SERVICE_ROLE_KEY`, `JWT_SECRET`, `CORS_ORIGINS` |

### `.env.local` (loyiha ildizi)

```env
NEXT_PUBLIC_SUPABASE_URL=https://XXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...          # yoki publishable key
NEXT_PUBLIC_API_URL=http://localhost:8002
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true        # Google yoqilgan bo‘lsa
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_GA_MEASUREMENT_ID=                # ixtiyoriy
# NEXT_PUBLIC_PAYMENTS_ENABLED=true         # Click/Payme tayyor bo‘lganda
```

> Hozir lokalda `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ishlatilishi mumkin — ikkalasi ham qo‘llab-quvvatlanadi.

### `backend/.env`

```env
SUPABASE_URL=https://XXXX.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...              # FAQAT serverda, hech qachon GitHub/Vercel ga emas!
SUPABASE_JWT_SECRET=your-jwt-secret           # Settings → API → JWT Secret
CORS_ORIGINS=http://localhost:3000
```

### Birinchi marta o‘rnatish

```powershell
pnpm install
cd backend
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
```

Ishga tushirish: [DEV-SERVER.md](./DEV-SERVER.md)

---

## 2. Supabase (Dashboard)

Project: `cixtesdcklcuxhviemnf` (yoki o‘zingizniki)

### 2.1 Database — migrationlar

```powershell
cd C:\Users\User\ishbor\Ishbor.Uz
supabase link --project-ref YOUR_REF    # birinchi marta
supabase db push --linked --yes
```

**18 ta migration** `supabase/migrations/` da — ularni remote ga push qiling.

| Migration | Nima qo‘shadi |
|-----------|---------------|
| `20240607000000_initial` | profiles, services, orders, RLS |
| `20240608000000_*` | projects, messages, reviews, is_admin |
| `20240609000000_*` | project-attachments bucket |
| `20240610000000_*` | avatars, service-media bucket |
| `20240611000000_*` | packages, referrals, pg_trgm |
| `20240613000000_*` | notifications, saved_items, RLS qattiqlashtirish |
| `20240614000000_*` | notification_reads |
| `20240615000000_*` | payments, escrow, transactions, withdrawal |
| `20240616000000_*` | project_applications, is_public |
| `20240616100000_*` | saved_freelancers |
| `20240617000000_*` | waitlist, saved_projects |
| `20240618000000_*` | username, is_banned, notification_preferences |
| `20240619000000` … `20240621000000` | batch yaxshilanishlar |
| `20240622000000_repair_profile_fields` | skills, hourly_rate, languages (agar remote da yo‘q bo‘lsa) |

⬜ **Tekshiring:** SQL Editor → `select column_name from information_schema.columns where table_name='profiles'` — `skills`, `username`, `wallet_balance` bormi?

### 2.2 Authentication

**Dashboard → Authentication → URL Configuration**

| Sozlama | Lokal | Production |
|---------|-------|------------|
| Site URL | `http://localhost:3000` | `https://ishbor.uz` yoki Vercel URL |
| Redirect URLs | `http://localhost:3000/**` | `https://ishbor.uz/**`, `https://*.vercel.app/**` |

**Providers (ixtiyoriy):**

| Provider | Qachon | Qadamlar |
|----------|--------|----------|
| Email | ✅ default | Email tasdiqlashni yoqing (production uchun tavsiya) |
| Google | ⬜ | Google Cloud OAuth → Supabase Google provider → `.env` da `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` |

**Email shablonlari:** Authentication → Email Templates — o‘zbekcha matn qo‘shish mumkin.

### 2.3 Storage (bucketlar)

Migration avtomatik yaratadi. **Dashboard → Storage** da borligini tekshiring:

| Bucket | Vazifa |
|--------|--------|
| `avatars` | Profil rasmi |
| `service-media` | Xizmat rasmlari |
| `project-attachments` | Loyiha rasmlari |

⬜ Agar bucket yo‘q bo‘lsa — tegishli migration ni qayta push qiling yoki SQL Editor dan yarating.

### 2.4 Realtime

Migration `messages` jadvalini `supabase_realtime` publication ga qo‘shadi.

⬜ **Dashboard → Database → Replication** — `messages` yoqilganini tekshiring.

### 2.5 Admin foydalanuvchi

Birinchi admin (SQL Editor):

```sql
update public.profiles
set is_admin = true
where email = 'sizning@email.com';
```

⬜ Admin panel: `/admin` — faqat `is_admin = true` bo‘lganlar kiradi.

### 2.6 RLS va xavfsizlik (production)

⬜ **Hali qo‘shish kerak (kod/audit bo‘yicha):**

- Backend `service_role` ishlatadi — RLS ni chetlab o‘tadi; authorization API da qo‘lda
- `handle_new_user` trigger — `role` ni `user_metadata` dan olmaslik (xavfsizlik)
- `referral_bonus` transaction type — DB check constraint bilan moslashtirish
- Waitlist jadvali — spam himoyasi (rate limit)

### 2.7 Hali yo‘q (kelajakda Supabase/schema)

| Funksiya | Holat |
|----------|-------|
| Vakansiyalar (`jobs`) | ❌ jadval yo‘q |
| Kompaniyalar (`companies`) | ❌ |
| CV fayllar | ❌ |
| Obuna (`subscriptions`) | ❌ — faqat `waitlist_emails` |
| Click/Payme webhook jadvallari | ❌ |
| Audit log | ❌ |

---

## 3. Backend (FastAPI) — host

Hozir **faqat lokal** (`pnpm dev:api`, port **8002**). Production uchun alohida host kerak.

### Tavsiya etilgan hostlar

- [Render](https://render.com)
- [Railway](https://railway.app)
- [Fly.io](https://fly.io)

### Hostda qo‘yiladigan env

| O‘zgaruvchi | Qiymat |
|-------------|--------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (maxfiy!) |
| `SUPABASE_JWT_SECRET` | JWT secret |
| `CORS_ORIGINS` | `https://ishbor.uz,https://your-app.vercel.app` |

### Start buyrug‘i

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Hali backend ga qo‘shish kerak (kod)

| # | Narsa | Ustuvorlik |
|---|-------|------------|
| 1 | Click / Payme haqiqiy integratsiya | P0 |
| 2 | Webhook imzo tekshiruvi | P0 |
| 3 | Escrow atomik tranzaksiya (Postgres RPC) | P0 |
| 4 | Cancel + held → avtomatik refund | P0 |
| 5 | Rate limit (Redis) | P1 |
| 6 | Email (Resend/SendGrid) | P1 |
| 7 | Structured logging + Sentry | P1 |
| 8 | Integration testlar | P1 |
| 9 | `/docs` ni production da yopish | P2 |

⬜ **CI:** GitHub Actions hozir faqat `python -m compileall` — pytest qo‘shish kerak.

---

## 4. Vercel (frontend — sayt)

### Environment Variables

**Vercel → Project → Settings → Environment Variables**

| O‘zgaruvchi | Production qiymati | Majburiy |
|-------------|-------------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://XXXX.supabase.co` | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key | ✅ |
| `NEXT_PUBLIC_API_URL` | Backend URL (masalan `https://api.ishbor.uz`) | ✅ |
| `NEXT_PUBLIC_SITE_URL` | `https://ishbor.uz` | ✅ |
| `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` | `true` / `false` | ⬜ |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 ID | ⬜ |
| `NEXT_PUBLIC_PAYMENTS_ENABLED` | `false` (hozir) | ⬜ |

> **Muhim:** `NEXT_PUBLIC_API_URL` production backend URL bo‘lishi kerak. Vercel `next.config.mjs` orqali `/api/v1` ni shu URL ga proxy qiladi.

### Domen

⬜ Vercel → Domains → `ishbor.uz` ulash  
⬜ DNS: A/CNAME yozuvlar  
⬜ Supabase Redirect URLs ga production domen qo‘shish

### Hali saytga qo‘shish kerak (UI/MVP)

| Sahifa/funksiya | Holat |
|-----------------|-------|
| `/jobs`, `/companies`, `/cv` | Coming Soon |
| Click/Payme to‘lov | Sandbox |
| Pro obuna | Waitlist |
| Email bildirishnomalar | Faqat in-app |
| SMS | Yo‘q |

---

## 5. GitHub

### Secrets (ixtiyoriy deploy uchun)

**Settings → Secrets and variables → Actions**

| Secret | Vazifa |
|--------|--------|
| `VERCEL_TOKEN` | Vercel deploy |
| `VERCEL_ORG_ID` | `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` |
| `SUPABASE_ACCESS_TOKEN` | `supabase db push` workflow |
| `SUPABASE_PROJECT_REF` | `cixtesdcklcuxhviemnf` |

### Hali commit qilinmagan (lokal)

⬜ `DEV-SERVER.md` — server run/stop yo‘riqnomasi  
⬜ `QOSHISH-KERAK.md` — shu fayl  
⬜ `supabase/migrations/20240622000000_repair_profile_fields.sql`  
⬜ `onboarding-page.tsx` o‘zgarishlari  

```powershell
git add DEV-SERVER.md QOSHISH-KERAK.md supabase/migrations/20240622000000_repair_profile_fields.sql
git commit -m "docs: dev server va setup checklist"
git push origin main
```

---

## 6. Tashqi servislar (kelajak)

| Servis | Nima uchun | Holat |
|--------|------------|-------|
| **Click** | To‘lov | ⬜ merchant shartnoma + webhook URL |
| **Payme** | To‘lov | ⬜ |
| **Resend / SendGrid** | Email | ⬜ |
| **Eskiz / Playmobile** | SMS OTP | ⬜ |
| **Redis** (Upstash) | Cache, rate limit, queue | ⬜ |
| **Sentry** | Xato monitoring | ⬜ |
| **Google Analytics** | `NEXT_PUBLIC_GA_MEASUREMENT_ID` | ⬜ |
| **Cloudflare** | CDN, WAF, DDoS | ⬜ |

---

## 7. Tezkor tekshiruv ro‘yxati

Ishga tushirgandan keyin:

```powershell
# 1. Backend
Invoke-RestMethod http://127.0.0.1:8002/api/v1/health

# 2. Frontend
# Brauzer: http://localhost:3000

# 3. Supabase migration
supabase db push --linked --dry-run

# 4. TypeScript
pnpm exec tsc --noEmit
```

| Tekshiruv | Kutilgan natija |
|-----------|-----------------|
| Health API | `{ "status": "ok" }` yoki shunga o‘xshash |
| Login/Register | Supabase Auth ishlaydi |
| Xizmatlar katalogi | API dan ma’lumot keladi |
| Buyurtma + sandbox to‘lov | `payment_status: held` |
| Admin | `is_admin` user kiradi |
| Rasm yuklash | Storage bucket ishlaydi |

---

## 8. MVP ustuvorligi (qisqa)

Hozirgi audit bo‘yicha **birinchi navbatda**:

1. ⬜ Backend ni production hostga chiqarish + Vercel `NEXT_PUBLIC_API_URL`
2. ⬜ Supabase barcha migrationlar sync (`db push`)
3. ⬜ Admin user + production redirect URL lar
4. ⬜ Escrow xavfsizligi (atomik to‘lov, cancel refund)
5. ⬜ Click/Payme integratsiya
6. ⬜ Email bildirishnomalar
7. ⬜ Testlar + monitoring

Batafsil backend audit: suhbatdagi **Backend Architecture Audit** hisoboti.

---

## Bog‘liq hujjatlar

| Fayl | Maqsad |
|------|--------|
| [DEV-SERVER.md](./DEV-SERVER.md) | Lokal server start/stop |
| [README.md](./README.md) | Umumiy loyiha + deploy |
| [.env.example](./.env.example) | Frontend env namunasi |
| [backend/.env.example](./backend/.env.example) | Backend env namunasi |
| [.cursor/AGENTS.md](./.cursor/AGENTS.md) | Kod arxitekturasi |
