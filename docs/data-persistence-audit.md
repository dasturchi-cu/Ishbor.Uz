# Data Persistence & Synchronization Audit

> **Sana:** 2026-06-09  
> **Maqsad:** Har bir foydalanuvchi harakati DB → API → Frontend orasida sinxron ekanligini tekshirish.

---

## Xulosa

| Qatlam | Holat |
|--------|-------|
| **Database (Supabase)** | 35+ migration, RLS, RPC, triggers — production-ready asos |
| **Backend (FastAPI)** | REST API, state machines, escrow RPC, platform drafts |
| **Frontend** | API client + Realtime + localStorage fallback |
| **Asosiy xavf** | UI placeholder (2FA, banner), vacancies placeholder, typing ephemeral |

**Umumiy baho:** ~85% persistence to'g'ri. Kritik tuzatishlar qo'llandi (quyida).

---

## 1. Profile

| Maydon | DB (`profiles`) | API | UI | Refreshdan keyin | Holat |
|--------|-----------------|-----|-----|------------------|-------|
| Ism (`full_name`) | ✅ | `PATCH /profiles/me` | Onboarding, Settings, Dashboard | ✅ | OK |
| Username | ✅ unique | ✅ | Barcha profil UI | ✅ | OK |
| Email | ✅ (auth trigger) | `GET` only | Settings (disabled) | ✅ | Read-only (to'g'ri) |
| Telefon | ✅ | ✅ | Register, Settings | ✅ | **Tuzatildi** — Settings input qo'shildi |
| Avatar | ✅ `avatar_url` | ✅ + Storage | Settings, Dashboard | ✅ | OK |
| Bio | ✅ | ✅ | Settings, Dashboard | ✅ | OK (500 char limit) |
| Region | ✅ | ✅ | Barcha | ✅ | OK |
| Specialty | ✅ | ✅ | Settings | ✅ | OK |
| Skills | ✅ `text[]` | ✅ | Onboarding, Settings | ✅ | OK |
| Hourly rate | ✅ | ✅ | Onboarding, **Settings** | ✅ | **Tuzatildi** |
| Experience level | ✅ | ✅ | Onboarding, **Settings** | ✅ | **Tuzatildi** |
| Languages | ✅ jsonb | ✅ | Onboarding, **Settings** | ✅ | **Tuzatildi** |
| Portfolio URLs | ✅ | ✅ | Settings | ✅ | OK |
| Role | ✅ | ✅ | AppProvider + API | ⚠️ | localStorage + API; xato yutiladi |

**Placeholder (saqlanmaydi):** business hours, profile banner upload, 2FA, withdrawal cards.

---

## 2. CV Builder

| Maydon | DB | API | Holat |
|--------|-----|-----|-------|
| Ism, headline, skills, tajriba, ta'lim, contacts | `saved_drafts` | `PUT /platform/drafts` | **Tuzatildi** — `useServerDraft('cv-builder')` |

- localStorage (instant) + Supabase (cross-device)
- Login talab qilinadi server sync uchun

---

## 3. Vacancies / Jobs

| Feature | Holat |
|---------|-------|
| `vacancies` jadvali | ❌ Feature flag `false` — placeholder |
| `/jobs` sahifa | `ProjectsCatalog` (ochiq loyihalar) |
| Saved jobs | `saved_projects` jadvali — ✅ API + optimistic UI |
| Arizalar | `project_applications` — ✅ CRUD |

---

## 4. Projects & Contracts

| Action | API | DB | UI sync | Holat |
|--------|-----|-----|---------|-------|
| Loyiha yaratish | `POST /projects` | `projects` | Redirect dashboard | **Tuzatildi** — `is_public=true` → `status=open` |
| Qoralama | `useServerDraft` | `saved_drafts` | local + server | OK |
| Taklif yuborish | `POST /applications` | `project_applications` | Redirect | OK |
| Hire → Contract | `PATCH applications` | `contracts` + `orders` | Notification | OK |
| Escrow fund | `POST /contracts/{id}/fund` | RPC + `escrow_transactions` | Refetch | OK (sandbox) |
| Files | `POST /contracts/{id}/files` | `project_files` | API mavjud | UI qisman |
| Reviews | `POST /contracts/{id}/reviews` | `project_reviews` | API mavjud | UI qisman |

---

## 5. Chat

| Feature | Storage | Realtime | Holat |
|---------|---------|----------|-------|
| Xabarlar | `messages` | ✅ INSERT/UPDATE | OK |
| Read status | `messages.read_at` | ✅ | OK (listda auto-mark) |
| Attachments | Storage URL in `content` | — | OK |
| Typing | Broadcast channel | — | Ephemeral (by design) |
| Online | `user_presence` | ✅ table | API mavjud, UI qisman |
| Contract chat link | `?contract=` | — | **Tuzatildi** → `order_id` resolve |
| Order conversation row | `conversations` | — | **Tuzatildi** — `ensure_order_conversation` on order create |

---

## 6. Notifications

| Feature | Storage | Holat |
|---------|---------|-------|
| DB notifications | `notifications` | ✅ Realtime |
| Synthetic (order/message) | Merged server-side | ✅ |
| Read state | `notification_reads` | ✅ |
| Dismiss | `notification_dismissals` | ✅ |
| Browser push seen | in-memory | ⚠️ Refreshda qayta ko'rsatishi mumkin |

---

## 7. Settings

| Setting | Storage | Cross-device | Holat |
|---------|---------|--------------|-------|
| Theme | localStorage + **`profiles.ui_preferences`** | **Tuzatildi** | ✅ |
| Language | localStorage + **`ui_preferences`** | **Tuzatildi** | ✅ |
| Timezone | **`ui_preferences`** | **Tuzatildi** | ✅ (Settings save) |
| Notification prefs | `notification_preferences` jsonb | ✅ | OK |
| Browser notif | localStorage only | ❌ | Device-local |

Migration: `20240629200000_ui_preferences.sql`

---

## 8. Saved Items

| Type | Table | Pattern |
|------|-------|---------|
| Services | `saved_items` | Optimistic + API rollback + sync on load |
| Freelancers | `saved_freelancers` | Same |
| Projects | `saved_projects` | Same |

---

## 9. State Management

```
AppProvider (React Context)
  ├── profile ← api.getProfile() on session
  ├── theme/language ← localStorage + ui_preferences (logged in)
  └── role ← localStorage + profiles.role

No Redux/Zustand — intentional for MVP
```

**Yo'qolish nuqtalari:**
- Optimistic saved-items → API fail → rollback ✅
- Role switch API fail → localStorage qoladi ⚠️
- React state only (CV — tuzatildi)

---

## 10. Qo'llangan tuzatishlar (2026-06-09)

1. **Projects:** `is_public=true` yaratishda `status=open` (draft emas)
2. **CV builder:** `useServerDraft` + `saved_drafts` API
3. **Profile Settings:** telefon, hourly_rate, experience_level, languages
4. **UI preferences:** migration + API + theme/language cross-device sync
5. **Chat:** `?contract=` → order_id; order yaratilganda `conversations` row
6. **Contract hire:** order uchun ham conversation yaratiladi
7. **useServerDraft:** remote restore callback (cross-device draft)
8. **Validation:** username max 30 (FE=BE), bio hint 500

---

## 11. Qolgan ishlar (keyingi sprint)

| Prioritet | Vazifa |
|-----------|--------|
| P1 | Unified chat UI (`/conversations` API) — contract threads |
| P1 | Vacancies haqiqiy jadval + API (feature flag yoqilganda) |
| P2 | Browser notification seen → localStorage |
| P2 | Message unread badge Realtime |
| P3 | Placeholder UI olib tashlash yoki ulash (banner, 2FA, withdrawal) |
| P3 | `ui_preferences` Settings appearance tabda timezone auto-save |

---

## 12. Tekshirish checklist

```bash
# Migration
supabase db push

# Backend
cd backend && pytest tests/

# Frontend
pnpm build
npx tsc --noEmit
```

**Manual test flow:**
1. Profil → Settings → telefon/stavka saqlash → refresh → tekshirish
2. Theme/o'zgartirish → boshqa brauzer/login → sync
3. CV builder → to'ldirish → refresh → qolganini tekshirish
4. Loyiha joylash → `/projects` katalogda ko'rinishi
5. Xabar yuborish → refresh → xabar qolishi
6. Bildirishnoma o'qilgan → refresh → unread yo'qolishi

---

*Alohida arxitektura: [marketplace-escrow-architecture.md](./marketplace-escrow-architecture.md)*
