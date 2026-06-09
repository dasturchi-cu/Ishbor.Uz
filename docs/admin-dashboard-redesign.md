# Elite Admin Panel — Audit & Redesign

> **Maqsad:** Kuniga 8 soat ishlaydigan operator/moderator uchun Linear/Stripe darajasidagi SaaS admin.  
> **Hozirgi holat:** Bitta uzun sahifa (`admin-page.tsx`, ~960 qator) + `AdminSaasPanel` pastda.

---

## 1. UI Audit (hozirgi muammolar)

| Element | Holat | Muammo |
|---------|-------|--------|
| **Layout** | ❌ | Sidebar/topbar yo'q; marketplace layout ichida |
| **Hierarchy** | ❌ | 10+ Card vertikal stack — scroll charchatadi |
| **Spacing** | ⚠️ | `space-y-8` OK, lekin sectionlar bir xil og'irlikda |
| **Tables** | ⚠️ | HTML table, sticky header yo'q, dense emas |
| **Charts** | ❌ | Faqat 4 ta raqam (SaaS panel), grafik yo'q |
| **Filters** | ⚠️ | Faqat client-side search; server filter yo'q |
| **Modals** | ❌ | Tasdiqlash modallari yo'q — xato bosish xavfi |
| **Typography** | ⚠️ | `text-2xl` KPI, lekin label `text-sm` — hierarchy zaif |
| **Colors** | ⚠️ | Kwork tokenlari; admin uchun alohida surface yo'q |
| **Click area** | ❌ | Table action tugmalar `size="sm"` — 32px atrofida |
| **Icons** | ❌ | Ko'p joyda matn-only navigation |

### Operator ta'siri
- Nizo hal qilish: scroll → disputes bo'limini qidirish → **4+ click, 15–30s**
- Foydalanuvchini ban: users jadvalini topish → **3+ click**
- Bugun nima bo'lgan: analytics pastda, real-time yo'q

---

## 2. UX Audit — Operator workflow

### Kunlik TOP-5 vazifalar (taxminiy chastota)

| # | Vazifa | Hozirgi click | Maqsad |
|---|--------|---------------|--------|
| 1 | Pending withdrawal tasdiqlash | 3–5 | **1–2** |
| 2 | Dispute hal qilish | 4–6 | **2** |
| 3 | Report/shikoyat ko'rish | 5+ | **2** |
| 4 | User ban/verify | 4 | **2** |
| 5 | Xizmat yashirish | 4 | **2** |

### Information architecture (yangi)

```
/admin                    → Dashboard (KPI + activity + charts)
/admin/users              → Users
/admin/disputes           → Disputes (order + contract)
/admin/escrow             → Escrow ledger
/admin/finance            → Withdrawals + revenue
/admin/projects           → Projects & contracts
/admin/moderation         → Reports + fraud + verifications
/admin/services           → Service moderation
/admin/notifications      → Broadcast (keyingi fazа)
/admin/settings           → Integrations + feature flags
```

---

## 3. Sahifa bo'yicha: Muammo → Yechim → Foyda

### 3.1 Dashboard (`/admin`)

| | |
|---|---|
| **Muammo** | KPI tarqoq; muhim alertlar ko'rinmaydi; analytics pastda |
| **Yechim** | Sidebar layout; KPI grid (10 metrika); action queue (withdrawals, disputes, reports); sparkline charts; audit activity feed |
| **UX foyda** | Operator 2 soniyada platforma sog'lig'ini ko'radi |
| **Biznes foyda** | Nizo/withdrawal kechikishi kamayadi → ishonch |

**Ko'rsatiladigan KPI:**
- Total / Active / New Today users
- Employers / Freelancers
- Projects / Open vacancies
- Revenue (30d) / Escrow held
- Pending disputes / Pending withdrawals

### 3.2 Users (`/admin/users`)

| | |
|---|---|
| **Muammo** | Server search yo'q; suspend alohida API; bulk action yo'q |
| **Yechim** | DataTable: server search, role/status filter, row actions dropdown, bulk ban/verify, user detail drawer |
| **UX foyda** | Qidiruv 1 maydon; amallar bir qatorda |
| **Biznes foyda** | Spam/fake account tez tozalanadi |

**API mavjud:** `GET/PATCH /admin/users`, `PATCH .../suspend` ✅

### 3.3 Companies (`/admin/companies`)

| | |
|---|---|
| **Muammo** | Companies jadvali yo'q — faqat feature flag |
| **Yechim** | Faza 2: `companies` entity + verify flow; hozircha placeholder + waitlist |
| **UX foyda** | — |
| **Biznes foyda** | B2B segment tayyor bo'lganda |

### 3.4 Projects (`/admin/projects`)

| | |
|---|---|
| **Muammo** | Admin projects view yo'q |
| **Yechim** | Tabs: Active / Pending payment / Disputed; contract link |
| **UX foyda** | Marketplace loyihalarini bir joydan nazorat |
| **Biznes foyda** | Fraud project tez aniqlanadi |

### 3.5 Escrow (`/admin/escrow`)

| | |
|---|---|
| **Muammo** | Escrow API bor, UI yo'q |
| **Yechim** | `GET /admin/escrow` jadvali; filter by action; export CSV |
| **UX foyda** | Moliyaviy shaffoflik |
| **Biznes foyda** | Audit va regulator talablar |

**API:** `GET /admin/escrow` ✅

### 3.6 Disputes (`/admin/disputes`)

| | |
|---|---|
| **Muammo** | Order disputes va contract disputes ajratilmagan; ikkalasi bir ro'yxatda emas |
| **Yechim** | Unified queue: order `disputed` + `GET /admin/contract-disputes`; resolve drawer |
| **UX foyda** | Barcha nizolar bir nav item |
| **Biznes foyda** | SLA: 24h ichida hal |

### 3.7 Moderation (`/admin/moderation`)

| | |
|---|---|
| **Muammo** | `AdminSaasPanel` sahifa oxirida — operator yetib bormaydi |
| **Yechim** | Reports + fraud + verifications tabs; keyboard `r` resolve |
| **UX foyda** | Shikoyatlar birinchi navda |
| **Biznes foyda** | Platforma xavfsizligi |

**API:** reports, fraud-logs, verifications ✅

### 3.8 Notifications (`/admin/notifications`)

| | |
|---|---|
| **Muammo** | Broadcast UI yo'q |
| **Yechim** | Faza 2: `POST /admin/notifications/broadcast` |
| **UX foyda** | Marketing/ops xabar yuborish |
| **Biznes foyda** | User engagement |

### 3.9 Finance (`/admin/finance`)

| | |
|---|---|
| **Muammo** | Withdrawals alohida card; revenue analytics alohida |
| **Yechim** | Bir sahifa: pending queue (sticky), revenue chart, transaction export |
| **UX foyda** | Moliyachi bir joyda |
| **Biznes foyda** | Cash flow nazorati |

### 3.10 Services (`/admin/services`)

| | |
|---|---|
| **Muammo** | List-based, filter yo'q |
| **Yechim** | Table + category filter + bulk hide |
| **UX foyda** | Moderatsiya tezlashadi |

---

## 4. Design System (Admin tokenlar)

Stripe/Linear uslubi — marketplace'dan ajralgan admin surface:

```css
--admin-bg: #F8FAFC;
--admin-sidebar: #0F172A;
--admin-sidebar-text: #94A3B8;
--admin-sidebar-active: #2563EB;
--admin-surface: #FFFFFF;
--admin-border: #E2E8F0;
--admin-text: #0F172A;
--admin-muted: #64748B;
--admin-danger: #DC2626;
--admin-warning: #D97706;
--admin-success: #059669;
```

**Typography:** 13px table body, 11px uppercase labels, 28px KPI numbers  
**Density:** Table row 44px, sidebar item 40px min-height  
**Icons:** Lucide, 16px nav, 20px KPI

---

## 5. Productivity Features

| Feature | Prioritet | Tavsif |
|---------|-----------|--------|
| Sidebar nav | P0 | 1-click modul |
| Command palette `⌘K` | P1 | User/order/dispute qidiruv |
| Bulk actions | P1 | Users, services |
| Saved filters | P2 | localStorage |
| Keyboard shortcuts | P2 | `g u` users, `g d` dashboard |
| Real-time poll | P1 | Dashboard 30s refresh |
| Confirm modals | P0 | Ban, delete, resolve dispute |

---

## 6. Responsive

| Breakpoint | Layout |
|------------|--------|
| Desktop ≥1280 | Sidebar 240px + content |
| Tablet 768–1279 | Collapsible sidebar |
| Mobile <768 | Bottom nav (4 item) + hamburger |

---

## 7. Backend gap analysis

| Metrika | API | Holat |
|---------|-----|-------|
| Total users | `/admin/stats` | ✅ |
| New today | — | **Qo'shiladi** `/admin/dashboard` |
| Active users (7d) | — | **Qo'shiladi** (orders/messages activity) |
| Employers/freelancers | — | **Qo'shiladi** count by role |
| Revenue | `/admin/analytics` | ✅ |
| Escrow balance | stats.escrow_held | ✅ (count, sum kerak) |
| Activity feed | `/admin/audit-logs` | ✅ |
| Contract disputes | `/admin/contract-disputes` | ✅ UI yo'q |

---

## 8. Implementatsiya fazalari

### Faza 0 — Shell ✅ (implement qilindi)
- [x] `AdminLayout` sidebar + topbar (`admin-layout.tsx`)
- [x] `/admin` dashboard KPI + activity + 30s poll (`admin-dashboard.tsx`)
- [x] `GET /admin/stats` kengaytirildi (new today, employers, escrow balance, …)
- [x] Sub-routes: `/admin/users`, `/disputes`, `/escrow`, `/finance`, `/moderation`, `/services`, `/orders`
- [x] Admin CSS tokenlar (`src/presentation/styles/admin.css`)
- [x] Site layout dan ajratish (`isAdminPath` — header/footer yo'q)

### Faza 0.5 — Escrow/Dispute tabs ✅
- [x] Escrow: summary KPI, transactions/milestones tabs, action/source filters
- [x] Disputes: all/orders/contracts/resolved tabs, confirm modals
- [x] Backend: `/admin/escrow/summary`, `/admin/milestones`, filter params
- [x] Migration: `fund_milestone_escrow_rpc`, `release_milestone_escrow_rpc`

### Faza 1 — Tables & Actions ✅
- [x] Confirm modals (ban, bulk, withdrawal, delete service)
- [x] Server-side user search (`/admin/users?search=`)
- [x] Bulk actions (`POST /admin/users/bulk`)

### Faza 2 — Charts & Real-time ✅
- [x] Recharts (users + revenue series on dashboard)
- [x] 30s dashboard poll (mavjud)
- [x] ⌘K command palette (`admin-command-palette.tsx`)
- [x] Saved filters (escrow + disputes, localStorage)

### Faza 3 — Broadcast & Companies ✅
- [x] `POST /admin/notifications/broadcast`
- [x] Companies table + `/admin/companies` + public `/api/v1/companies`
- [x] Migration: `20240629400000_companies_broadcast.sql`

---

## 9. Muvaffaqiyat mezonlari

| Metrika | Hozir | Maqsad |
|---------|-------|--------|
| Dispute hal qilish vaqti | ~60s | <15s |
| Withdrawal approve | ~45s | <10s |
| Platform overview | scroll 30s+ | <5s |
| Operator charchoq | Yuqori | Past |

---

*Implementatsiya: `src/presentation/features/admin/` + `app/(main)/admin/`*
