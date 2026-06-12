# Authenticated Mobile Audit Report

**Date:** 2026-06-12  
**Tools:** Playwright MCP · Chrome DevTools MCP  
**Account:** Active freelancer session (`/dashboard` — e2e/diag test user)  
**Viewports:** 320 · 375 · 390 · 768 · 1024 px  

---

## Scope

| Surface | Route |
|---------|-------|
| Freelancer dashboard | `/dashboard` |
| Client dashboard | `/dashboard/client` |
| Messages / Chat | `/dashboard/messages` |
| Wallet | `/dashboard/wallet` |
| Notifications | `/dashboard/notifications` |
| Settings | `/dashboard/settings` |
| Profile | `/dashboard/profile` |
| Orders | `/dashboard/orders` |

**Checked:** horizontal overflow, layout breaks, touch targets (&lt;40×40px), modals/drawers (structure), forms, tables, chat toolbar, wallet hero, dashboard widgets.

---

## Executive summary

| Metric | Pre-fix | Post-fix |
|--------|---------|----------|
| Pages × viewports tested | 40 | 40 |
| Horizontal overflow | **0** | **0** |
| Table overflow | 0 | 0 |
| Mobile touch issues (≤390px, excl. logo) | ~25+ controls | **9** (3 surfaces × 3 widths) |
| Client `/dashboard/client` at 320px | Flaky redirect | **Stable** |

**Verdict:** No P0 blockers. P1 touch-target issues on shared chrome and dashboard CTAs were fixed. Remaining mobile warnings are low-severity (1 control per dashboard/settings — typically inline text inside larger tap cards).

---

## Findings & fixes

### P0 — None

- No horizontal scroll overflow on any authenticated surface at any tested width.
- Auth-gated routes load correctly when session is active.
- Chat, wallet, notifications, orders render without layout collapse.

### P1 — Fixed

| Issue | Location | Fix |
|-------|----------|-----|
| Header wallet pill 36px tall | `shell-chrome.css` `.header-wallet-pill--compact` | `min-height: 44px` |
| Avatar menu trigger 34px | `.avatar-dropdown-trigger` | `height/min-height: 44px` |
| Chat mute 38×38 | `.chat-mute-btn` | `44×44px` |
| Chat filter 38px | `.chat-filter-btn` | `44px` height |
| Breadcrumb links ~18px tall | `.breadcrumb-link` | `min-height: 44px` + padding |
| Profile quick links 20px | `.profile-view-link` | `min-height: 44px` |
| Notification filters 32px | `notifications-page.tsx` | `min-h-[44px] py-2.5` |
| Order payment chips 28px | `dashboard-orders-page.tsx` | `min-h-[44px] py-2` |
| Referral share/copy 32px | `referral-banner.tsx` | `size="md"` + `min-h-[44px]`, stacked on mobile |
| Dashboard drawer menu 36px | `dashboard-layout.tsx` | `h-11 w-11` (44px) |
| Sidebar nav &lt;44px | `.dashboard-nav-link` | `min-height: 44px` on nav links, help, logout |
| Wallet text links small | `product-system.css` | Mobile `min-height: 44px` on `.ps-text-link` |
| Settings profile URL overflow | `profile-settings.tsx` | Display path only; `word-break` CSS |
| Dashboard widget links 20px | `route-dashboard.css` `.dashboard-panel-footer-link` | `min-height: 44px` |
| Onboarding checklist rows | freelancer/client checklists | `min-h-[44px]` |
| Compact empty-state CTA | `empty-state.tsx` | `size="md"` + `min-h-[44px]` |
| Recommended action card | `.dash-rec-single` | `min-height: 44px` |

### P2 — Accepted / backlog

| Issue | Notes |
|-------|-------|
| Header logo link ~20–24px visible box | Parent header row provides adequate tap area; logo is secondary nav |
| Desktop sidebar at 1024px: lang pill 36px | Desktop pointer precision; mobile drawer uses 44px links |
| Fresh Playwright context login | `diag-timeout-test@ishbor.uz` login failed in isolated CI context this session; MCP reused valid session |
| Freelancer + client dual-role audit | Single session tested both `/dashboard` and `/dashboard/client` routes |

---

## Per-surface notes

### Dashboard (freelancer & client)

- Stat cards, recommended actions, and order rows stack cleanly at 320–390px.
- Referral banner buttons stack full-width on narrow screens.
- No widget grid overflow.

### Messages

- Conversation list + filters fit viewport; mute and filter buttons meet 44px after fix.
- Empty state readable; no chat thread overflow in list-only view.

### Wallet

- Balance hero and transaction list stack on mobile.
- Top-up CTA uses product text-link with 44px mobile target.
- No table horizontal bleed.

### Notifications

- Filter pills and list cards readable; mark-all-read visible.
- No overflow.

### Settings

- Tab nav scrolls horizontally on mobile (existing pattern).
- Profile public link shows path (`/freelancer/...`) instead of full origin URL.

### Profile

- Avatar + form fields usable; view-profile links enlarged.

### Orders

- Status tabs use 44px min-height on mobile; payment filter chips enlarged.

---

## Verification (post-fix)

```
Total checks:     40
Overflow:         0
Mobile ≤390px with remaining small targets: 9 (dashboard home ×3 widths, client home ×3, settings ×3)
Client dashboard @320px: /dashboard/client ✓
```

Screenshots: `docs/browser-audit/auth-mobile/screenshots/post-fix-*.png`

Audit script (repeatable): `node scripts/tools/auth-mobile-audit.mjs`

---

## Files changed

```
src/presentation/styles/shell-chrome.css
src/presentation/styles/product-system.css
src/presentation/styles/route-dashboard.css
src/presentation/components/layout/dashboard-layout.tsx
src/presentation/components/layout/referral-banner.tsx
src/presentation/features/notifications/notifications-page.tsx
src/presentation/features/dashboard/dashboard-orders-page.tsx
src/presentation/features/dashboard/freelancer-dashboard.tsx
src/presentation/features/dashboard/client-dashboard.tsx
src/presentation/components/dashboard/freelancer-onboarding-checklist.tsx
src/presentation/components/dashboard/client-onboarding-checklist.tsx
src/presentation/components/ui/empty-state.tsx
src/presentation/features/profile/profile-settings.tsx
scripts/tools/auth-mobile-audit.mjs (new)
```

---

## Recommendations (post-launch)

1. Seed E2E auth storage state for CI mobile regression (`storageState` in Playwright config).
2. Add visual regression for dashboard @375px in `e2e/` (messages, wallet, settings).
3. Audit **chat thread** view with an active conversation (send message, attachment drawer).
4. Test **wallet top-up modal** and **withdraw drawer** at 320px in a follow-up pass.
