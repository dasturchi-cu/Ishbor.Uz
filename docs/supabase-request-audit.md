# Supabase DB so'rovlari — 1100/soat tahlili

## Muammo

Dashboard **REST cold load** ~4–5 ta HTTP so'rov (FastAPI proxy orqali).  
Supabase Dashboard **Database Requests** esa ~1100/soat ko'rsatadi.

Bu farq normal: Supabase metrikasi **PostgREST (DB) chaqiruvlari**ni sanaydi, brauzerdagi REST sonini emas.

---

## Kod bo'yicha isbotlangan manbalar (taxmin emas)

### 1. Har bir autentifikatsiyalangan API → `profiles.select` (auth_deps)

Har bir `Authorization: Bearer` bilan kelgan FastAPI endpoint **1 ta** `profiles.select` ishga tushiradi (`backend/app/deps.py`, `auth_deps`).

5 ta REST chaqiruv = **5 ta profiles** (auth_deps).

### 2. `GET /dashboard/summary` — bitta REST, ~8–9 ta DB

| # | Query | Manba |
|---|-------|-------|
| 1 | `profiles.select` | auth_deps |
| 2 | `profiles.select` | `_fetch_profile` (dublikat) |
| 3 | `orders.select` | `_build_home` |
| 4 | `projects.select` / `services.select` | `_build_home` |
| 5 | review stats | `_build_home` |
| 6 | `user_reputation.select` | `_build_home` |
| 7 | `messages` count | `_build_badges` |
| 8 | `notifications` count | `_build_badges` |

### 3. `GET /dashboard/badges` — BadgeCountsProvider (har sahifa)

Summary bilan **badge count dublikat** — provider alohida `GET /dashboard/badges` chaqiradi (~3 DB: auth + 2 count).

### 4. `GET /notifications` — ~7–8 DB / chaqiruv

Synthetic qism: `orders` (2 marta), `messages`, `reviews`, `notification_reads`, `notification_dismissals`.

**2 ta komponent** bir xil hook ishlatadi, lekin **2 ta Realtime subscription**:

- `BrowserNotificationWatcher` (`site-layout.tsx`)
- `NotificationDropdown` (`header.tsx`)

### 5. `GET /platform/activity-feed` — ~5–6 DB

`user_activities`, `orders`, `profiles`, RPC yoki `messages`, `transactions`.

### 6. Next.js `proxy.ts` — har HTML navigatsiya

Har match qilingan so'rov: `auth.getUser`.  
Har `/dashboard/*`: qo'shimcha `profiles.select`.

### 7. Realtime → invalidate loop

| Hook | Invalidate natijasi |
|------|---------------------|
| `useInboxRealtime` | `dashboard/badges` → ~3 DB |
| `useNotificationsRealtime` x2 | `notifications` (~8 DB) + `badges` (~3 DB) |

Har realtime event → **~11 DB** refetch.

---

## Dashboard cold load — haqiqiy DB hisob

| Manba | REST | DB |
|-------|------|-----|
| summary | 1 | ~9 |
| badges (provider) | 1 | ~3 |
| activity-feed | 1 | ~6 |
| notifications (watcher) | 1 | ~8 |
| freelancers | 1 | ~2–4 |
| proxy middleware | — | 1–2 |
| **Jami** | **~5 REST** | **~29–32 DB** |

~18 DB/daq × 60 = **~1080/soat** — 1100 bilan mos.

---

## Instrumentatsiya

### Yoqish

`.env.local`:

```
NEXT_PUBLIC_SUPABASE_REQUEST_DEBUG=1
```

`backend/.env`:

```
SUPABASE_REQUEST_DEBUG=1
```

### Brauzer

```
[IshBor supabase] { queryName, endpoint, component, kind, countTotal, lastHour }
```

```js
window.__ISHBOR_SUPABASE_DEBUG__.dump()
window.__ISHBOR_SUPABASE_DEBUG__.top10()
```

### Backend

```bash
curl http://127.0.0.1:8002/api/v1/platform/request-audit/top
curl http://127.0.0.1:8002/api/v1/platform/request-audit/all
```

### Middleware

Next server console: `[IshBor supabase] { kind: 'middleware', queryName: 'auth.getUser', ... }`

---

## Top 10 olish

1. Debug flag yoqish, 10–15 daqiqa foydalanish.
2. `window.__ISHBOR_SUPABASE_DEBUG__.dump()`
3. `GET /platform/request-audit/top`
4. Next terminal — middleware chastotasi.
