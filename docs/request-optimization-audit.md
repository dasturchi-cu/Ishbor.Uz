# Supabase / API request optimizatsiyasi

Maqsad: Free plan uchun HTTP va DB so'rovlarini kamaytirish (≥50% dashboard regression fix).

## Regression audit (2026-06-09)

Oldingi optimizatsiyadan keyin requestlar qayta oshgan. Sabablari:

| Muammo | Ta'sir | Tuzatish |
|--------|--------|----------|
| `useDashboardHome` `home` + `badges` parallel (2 REST) | Dashboard +1 | `getDashboardOverview` (1 REST) |
| `useDashboardBadges` to'liq `listNotifications` yuklaydi | Har sahifa +1 og'ir so'rov | `notification_unread` badge API da |
| Notification dropdown ochilganda `refresh()` | Har ochish +1 | Olib tashlandi (React Query cache) |
| `getCachedSession`: `getUser` + `getSession` har doim | Auth +1 | Faqat `getSession`; `getUser` fallback |
| `syncSession` + `refreshProfile` profil cache borida ham | +1 `GET /profiles/me` | Cache bo'lsa skip |
| Dashboard home alohida `getProfile` + summary keraksiz | 2 profil so'rov | `GET /dashboard/summary` batch |

---

## Dashboard cold load — hozirgi holat (taxminiy)

| So'rov | Endpoint | Manba |
|--------|----------|-------|
| 1 | Supabase `getSession` | `session-cache` (AppProvider) |
| 0–1 | `GET /profiles/me` | Faqat cache bo'sh bo'lsa |
| 1 | `GET /dashboard/summary?role=` | `useDashboardSummary` (home sahifa) |
| 1 | `GET /dashboard/badges` | `BadgeCountsProvider` (yengil count) |
| 1 | `GET /platform/activity-feed` | `DashboardActivityFeed` |
| 1 | `GET /freelancers` | Client dashboard (tavsiya) |

**Client dashboard cold:** ~4–5 REST (oldin ~8–10 regression paytida)

**Freelancer dashboard cold:** ~3–4 REST

**Navigatsiya (dashboard ichida):** React Query cache hit — 0 qo'shimcha (staleTime 60s, refetchOnMount: false)

---

## Komponent → query mapping

| Komponent | Query / API | Duplicate? |
|-----------|-------------|------------|
| `AppProvider` | `getSession`, `GET /profiles/me` | Yo'q (inflight dedupe) |
| `BadgeCountsProvider` | `GET /dashboard/badges` | Summary bilan badge cache share |
| `NotificationDropdown` | `notifications` query | Shared cache, dropdown refresh yo'q |
| `BrowserNotificationWatcher` | `notifications` query | Shared cache (subscriber only) |
| `ClientDashboard` | `GET /dashboard/summary` | Overview + profile batch |
| `FreelancerDashboard` | `GET /dashboard/summary` | Xuddi shu |
| `DashboardServicesPage` | `dashboard/home` cache | Summary dan hydrate |
| `Header` / `Sidebar` | `useApp().profile` | Alohida fetch yo'q |
| `HeaderWalletPill` | `refreshProfile` faqat `/wallet` | OK |

---

## React Query sozlamalari

| Param | Qiymat | Fayl |
|-------|--------|------|
| `staleTime` | 60s | `query-provider.tsx`, badge/home hooks |
| `gcTime` | 5 min | `query-provider.tsx` |
| `refetchOnWindowFocus` | **false** | `query-provider.tsx` |
| `refetchOnMount` | **false** | dashboard/badge/activity hooks |
| `retry` | network/5xx: 3x | `query-provider.tsx` |

---

## Backend batch endpointlar

| Endpoint | Nima qaytaradi |
|----------|----------------|
| `GET /dashboard/badges` | `message_unread`, `notification_unread` |
| `GET /dashboard/home?role=` | orders, services/projects, review_stats, reputation |
| `GET /dashboard/overview?role=` | home + badges (1 REST) |
| `GET /dashboard/summary?role=` | **profile + wallet + home + badges + review_stats** |
| `GET /dashboard/reviews?role=` | reviews + stats |
| `GET /messages/inbox` | threads + legacy |

---

## Debug mode

`.env.local` ga qo'shing:

```
NEXT_PUBLIC_REQUEST_DEBUG=1
```

Console da har bir API va query chaqiruvi sanaladi:

```
[IshBor request] { name: 'GET /api/v1/dashboard/summary?role=client', count: 1, ... }
```

**Supabase DB (PostgREST) alohida audit:** [supabase-request-audit.md](./supabase-request-audit.md) — `NEXT_PUBLIC_SUPABASE_REQUEST_DEBUG=1` + `SUPABASE_REQUEST_DEBUG=1`.

---

## Realtime (polling yo'q)

- Xabar badge: `useInboxRealtime` → `invalidateQueries(dashboardBadges)`
- Bildirishnoma: `useNotificationsRealtime` → `invalidateQueries(notifications + badges)`
- Chat thread: mavjud order/conversation realtime

---

## Kamayish xulosasi

| Metrika | Regression | Hozir | Kamayish |
|---------|------------|-------|----------|
| Dashboard cold REST | ~8–10 | ~4–5 | **~50%** |
| Auth Supabase calls | 2 (user+session) | 1 (session) | **50%** |
| Badge notification load | to'liq list | DB count | **~95%** |
| Dropdown ochish | +1 refresh | 0 | **100%** |

---

## Keyingi qadamlar (ixtiyoriy)

- `BadgeCountsProvider` ni summary bilan birlashtirish (dashboardda 1 badge so'rovini olib tashlash)
- `GET /notifications/unread-count` synthetic bildirishnomalar bilan aniqroq count
- Summary prefetch AppProvider da (faqat dashboard yo'li)
