# Visible Data Cleanup Report

**Date:** 2026-06-12 · **Scope:** User-facing copy, landing, catalog, reviews, payments

## Summary

| Category | Found | Action |
|----------|-------|--------|
| Fake landing freelancer cards | 4 placeholder cards ("Mutaxassis 1…4") | **Removed** — honest empty state |
| Fake testimonial i18n | 9 hardcoded quotes + "sample reviews" note | **Removed** (API-driven reviews already in place) |
| Junk catalog (`test`, `tes`, `asdf`, …) | DB listings + activity feed | **Filtered** via `catalog_quality` |
| Public review junk | Low-quality comments in `/reviews/recent` | **Filtered** |
| Payment "Sandbox (test)" labels | Receipts + provider names | **Renamed** → Demo payment |
| Hero copy "escrow test mode" | Unused `kwork_hero_title` strings | **Renamed** → escrow protection |
| Admin fraud labels (English only) | Hardcoded `TYPE_LABELS` | **i18n** uz/ru/en |
| `demo_account` i18n | Dead key, never rendered | Left in locale files (harmless) |
| Form `placeholder` attrs | Input hints (`email_placeholder`, etc.) | **Kept** — UX, not fake data |
| Test files / backend tests | `test`, `mock` in `backend/tests` | **Kept** — not user-visible |

## Fixes applied

### 1. Landing — featured freelancers empty state

**Before:** Four fake `FreelancerCard` rows (`Mutaxassis 1`, hardcoded `Toshkent shahri`, 0 ratings).

**After:** Dashed empty state with CTA to register or browse freelancers (matches testimonials pattern).

**File:** `src/presentation/features/landing/landing-sections.tsx`

### 2. Landing — testimonial copy cleanup

**Before:** `landing-i18n.ts` contained fabricated Sardor/Nilufar/Jasur quotes and `landing_testimonials_demo_note`.

**After:** Removed dead keys. `LandingTestimonials` already loads real data from `GET /api/v1/reviews/recent` or shows empty state.

**File:** `src/infrastructure/i18n/landing-i18n.ts`

### 3. Catalog quality — `tes` and prefixes

Extended `catalog_quality.py`:

- Block exact title `tes`
- Block titles starting with `tes` (catches `tes`, `testing`, …)
- Added `is_catalog_quality_text()` for reviews/activity

**Files:** `backend/app/catalog_quality.py`, `backend/tests/test_catalog_quality.py`

### 4. Public reviews API

`GET /reviews/recent` now skips comments that fail quality heuristics (junk/test/spam text).

**File:** `backend/app/routers/reviews.py`

### 5. Landing activity feed

`GET /stats/public` → `recent_activity` skips orders/services with junk titles.

**File:** `backend/app/routers/stats.py`

### 6. Payment / receipt labels

| Key | Before | After (uz) |
|-----|--------|------------|
| `payment_provider_sandbox` | Sandbox (test) | Demo to'lov |
| `receipt_provider_sandbox` | Sandbox (test) | Demo to'lov / Демо-оплата / Demo payment |
| `kwork_hero_title` | …escrow test rejimi | …escrow himoyasi |

**Files:** `index.ts`, `locale-en.ts`, `locale-ru.ts`, `trust-i18n.ts`

### 7. Admin fraud center

Fraud type labels localized (uz/ru/en) instead of hardcoded English.

**Files:** `admin-i18n.ts`, `admin-fraud-page.tsx`

## Not changed (intentional)

| Item | Reason |
|------|--------|
| `email_placeholder: name@example.com` | Standard form hint |
| `payment_sandbox_pay` button text | Means "Pay now" in prod copy, not "test" |
| `sandbox` payment provider in dev | Technical provider id; label is user-friendly |
| `portfolio_empty_own_desc` "work samples" | Means portfolio samples, not demo data |
| `report_category_fake` | Legitimate report reason label |
| CSS `.placeholder`, `data-placeholder` on images | Technical, not content |
| E2E account `diag-timeout-test@ishbor.uz` | Test infra only |

## Remaining gaps (DB / ops)

| Gap | Priority | Recommendation |
|-----|----------|----------------|
| Junk rows still in DB | P1 | Admin moderation queue or one-time SQL cleanup |
| Hidden junk still counts in raw `services` stat | P2 | Use quality-filtered count in public stats |
| `demo_account` dead i18n keys | P3 | Remove in i18n prune pass |
| `take_test` dead i18n (skills quiz) | P3 | Wire feature or remove keys |

## Verification

```bash
cd backend && python -m pytest tests/test_catalog_quality.py -q
pnpm type-check
```

Manual: landing with empty freelancers → no fake cards; landing testimonials → API or empty state; receipts show "Demo to'lov" not "Sandbox (test)".
