# Analytics Coverage & Funnel Report

**Date:** 2026-06-12 · **Scope:** MVP conversion funnel · **Storage:** `analytics_events` (Supabase)

## Event coverage

| Event | `event_name` | Source | Status |
|-------|--------------|--------|--------|
| Registrations | `register` | `POST /api/v1/platform/audit/register` after signup | ✅ |
| Register funnel views | `funnel_register_view` | Client `trackFunnelEvent` on register page | ✅ |
| Register funnel complete | `funnel_register_complete` | Client after successful signup | ✅ |
| Logins | `login` | `record_login_attempt` on successful auth | ✅ |
| Profile completion | `onboarding_complete` | Server `track_activation_once` when profile patch sets `onboarding_completed` | ✅ |
| Service views | `service_view` | `POST /api/v1/services/{id}/view` (deduped 1h) | ✅ |
| Freelancer views | `freelancer_view` | `POST /api/v1/profiles/{id}/view` (deduped 1h) | ✅ |
| Project views | `project_view` | `POST /api/v1/projects/{id}/view` (deduped 1h) | ✅ |
| Messages started | `message_started` | First message in a conversation (`send_message`) | ✅ |
| Checkout started | `checkout_started` / `funnel_checkout_started` | Service order modal open (auth vs guest) | ✅ |
| Payment attempts | `payment_attempt` | `checkout_order` + `pay-wallet` endpoints | ✅ |
| Payment succeeded | `payment_succeeded` | `hold_escrow` / `pay_order_from_wallet` after escrow held | ✅ |

### Supporting funnel events (pre-existing)

- `funnel_landing_cta_click` — landing CTA
- `funnel_register_role_select`, `funnel_register_step2` — register steps
- `funnel_browse_catalog` — hero search / catalog browse
- `search` — catalog search (not in core funnel table)

## Funnel stages (admin dashboard)

`GET /api/v1/admin/analytics?days=N` returns `funnel_report`:

| Stage ID | Events counted | Conversion from previous |
|----------|----------------|------------------------|
| `register_views` | `funnel_register_view` | — |
| `registrations` | `register` | vs register views |
| `logins` | `login` | vs registrations (fallback: register views) |
| `profile_completion` | `onboarding_complete` | vs registrations |
| `discovery_views` | `service_view` + `freelancer_view` + `project_view` | — (breakdown per type) |
| `checkout_started` | `checkout_started` + `funnel_checkout_started` | vs discovery views |
| `payment_attempts` | `payment_attempt` | vs checkout started |
| `payment_succeeded` | `payment_succeeded` | vs payment attempts |
| `messages_started` | `message_started` | — (parallel engagement metric) |

### Summary rates (`funnel_report.summary`)

- `signup_rate` — registrations / register views
- `onboarding_rate` — onboarding complete / registrations
- `checkout_rate` — checkout started / discovery views
- `payment_conversion` — payment succeeded / payment attempts

## Implementation notes

1. **View deduplication:** Service, freelancer, and project views use `record_view_if_new` (1-hour window per viewer). Analytics events fire only on new views — avoids inflation, may undercount repeat visits.
2. **Login tracking:** Successful logins only; failed attempts stay in `security_events`.
3. **Profile completion:** Server-side on profile PATCH — no duplicate client event needed.
4. **Checkout:** Guest → anonymous funnel event with `session_id`; logged-in → `checkout_started` via `/analytics/track`.
5. **Payments:** Attempt logged at API entry; success logged when escrow is held (sandbox, wallet, Click, Payme webhooks).

## Admin UI

`/dashboard/admin/analytics` — KPI cards for all event counts + funnel table with stage counts, step conversion %, and summary rates.

## Gaps / future work

| Gap | Priority | Notes |
|-----|----------|-------|
| Project checkout funnel | P2 | No project-based checkout modal yet |
| Message started without order | — | Tracked for all new conversations |
| Repeat view analytics | P3 | Optional `service_view_raw` without dedup |
| Client-side payment success beacon | P3 | Server authoritative via webhooks |
| UTM / campaign attribution | P2 | Extend `properties` on register/checkout |

## Verification

```bash
cd backend && python -m pytest tests/test_analytics_funnel.py -q
pnpm type-check
```

Restart API after backend changes: `pnpm dev:stop:api` → `pnpm dev:api`.
