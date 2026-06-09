# IshBor.uz — Product Polish Agent Rejasi



> **Manba:** [product-polish-checklist.md](./product-polish-checklist.md)  

> **Bootstrap:** AGENTS.md → plan-status.md → mvp.md  

> **Agent:** har sprint oxirida checklist yangilanadi.



---



## Sprint xaritasi (6 bosqich)



| Sprint | Muddat | Bo'limlar | Maqsad |

|--------|--------|-----------|--------|

| **S1** | 1–2 kun | 2.1, 1.3, 4.1, 4.2, 4.4, 2.2, 3.1, 1.2, 2.4, 8.3 | Copy + trust + nav + logged-in home |

| **S2** | 2–3 kun | 6.1, 3.3, 3.4, 2.3 | Pul markazi, header nav, buyurtma stepper |

| **S3** | 3–4 kun | 7.1, 7.2, 7.3, 4.3, 5.3 | Marketplace feeling, empty states |

| **S4** | 4–5 kun | 5.1, 5.2, 5.4, 6.2, 6.3 | Visual hierarchy, checkout |

| **S5** | 5–7 kun | 8.1, 8.2, 1.1, 1.4 | Brend (Kwork→IshBor), design parity |

| **S6** | 7–10 kun | 3.2, 8.4, qolganlar | IA birlashtirish, enterprise yashirish |



---



## S1 — Agent vazifalari ✅ (2026-06-10)



### Copy va til (2.1 + 1.3)

- [x] `index.ts` + `landing-i18n.ts` + `dashboard-i18n.ts` — sandbox/test user UI dan

- [x] `#1` da'vo yumshatish, komissiya messaging value ga

- [x] `waitlist_saved_local` — user-friendly

- [x] `payment_fallback_sandbox` — aniq keyingi qadam



### Trust (4.1 + 4.2 + 4.4)

- [x] `TrustBrandLogos` bo'sh blok olib tashlandi

- [x] Service detail shablon includes/FAQ olib tashlandi

- [x] `escrow_steps_disclaimer` UI dan olib tashlandi

- [x] Blog editorial note + roadmap postlar yashirildi

- [x] Pricing Pro rejimi yashirildi



### IA (3.1 + 1.2)

- [x] Dashboard nav → 5 ta: Bosh, Buyurtmalar, Xabarlar, Pul, Profil

- [x] Escrow alohida nav dan olib tashlandi

- [x] Logged-in user `/` da marketplace ko'radi (faqat onboarding redirect)



### UX (2.2 + 2.4)

- [x] Testimonials bo'sh → EmptyState (demo fallback olib tashlandi)

- [x] Referral banner dashboard dan olib tashlandi (wallet/settings da qoladi)



---



## S2 — Agent vazifalari ✅ (2026-06-10)



- [x] `/dashboard/payments` va `/dashboard/escrow` → `/dashboard/wallet` redirect

- [x] Hamyonda "Himoyalangan buyurtmalar" bo'limi (`?tab=protected`)

- [x] Logged-in marketplace sahifalarida CategoryNav (header)

- [x] Logo: dashboard ichida → dashboard, qolgan joyda → `/`

- [x] Buyurtma ro'yxati: harakatlar detailga, `OrderProgressStepper` + hint

- [x] `order-next-step.ts` — keyingi qadam matnlari

- [x] Terminologiya: Escrow → Himoyalangan to'lov (uz/ru/en)

- [x] `orders-list.tsx` soddalashtirildi



---



## S3 — Agent vazifalari ✅ (2026-06-10)



- [x] Kategoriya 0 count → `category_explore_cta` ("Ko'rish")

- [x] Service card: yangi freelancer badge, narx primary, muddat meta

- [x] Empty catalog discovery (freelancer + loyiha CTA)

- [x] Liquidity past: region/daraja filterlari yashiriladi, `sort_newest` default

- [x] `MarketplacePulse` — haqiqiy stats (yolg'on "daqiqa oldin" olib tashlandi)

- [x] `LandingStatsRow` — 0 stat yashiriladi



**Fayllar:** marketplace-pulse, landing-sections, services-catalog, service-card, landing-i18n, index.ts



---



## S4 — Agent vazifalari ✅ (2026-06-10, qisman)



- [x] Hero: qidiruv primary, browse tugmasi olib tashlandi, ikkilamchi qatlam

- [x] Dashboard focal widget (`dash_focal_pay` / `dash_focal_orders`)

- [x] Banner stacking: 1 ta alert (client + freelancer dashboard)

- [x] Onboarding checklist: 3 sessiya limiti

- [x] Profil: `member_since` faqat haqiqiy sana, `isPro` ≠ verified

- [x] `client_stat_spent_note` olib tashlandi

- [x] Multi-step checkout (6.2) — `ServiceOrderCheckout` 3 bosqich



**Fayllar:** landing-page, dashboard-hero, client/freelancer-dashboard, onboarding-session-limit, freelancer-profile



---



## S5–S6 — Yakunlandi (2026-06-10)



- [x] `ISHBOR_CATEGORY_ITEMS` alias

- [x] Header nav: blog/pricing olib tashlandi, `nav_project_marketplace`

- [x] Promo banner faqat mehmonlar uchun

- [x] `footer_payments_soon` yumshatildi

- [x] `--ishbor-*` token aliaslari (`tokens.css`)
- [x] `kwork-*` CSS klasslari → `ishbor-*` (to'liq migratsiya)

- [x] Dashboard / landing design parity (8.2)

- [x] Terminologiya lug'ati (3.4) — `terminology.ts` + glossary

- [x] Activity feed marketplace home ga (`LandingRecentActivity` + stats API)



---



## Progress kuzatuv



| Sprint | Holat | Checklist |

|--------|-------|-----------|

| S1 | ✅ | 9/30 |

| S2 | ✅ | — |

| S3 | ✅ | — |

| S4 | ✅ | — |

| S5 | ✅ | token + klass migratsiya |

| S6 | ✅ | 30/30 (100%) |



## S5–S6 davomi ✅ (2026-06-10)

- [x] Landing hero `::before`/`::after` CSS pseudo tuzatildi
- [x] Terminologiya: birja → loyiha bozori (`terminology-glossary.md`)
- [x] Portfolio bo'sh EmptyState (o'z / mehmon profil)
- [x] Buyurtma to'lov: komissiya disclaimer → `payment_checkout_summary`
- [x] `dash-kpi--muted` + stat-card ikkilamchi og'irlik

- [x] `dispute_opened` — "tez orada" olib tashlandi
- [x] `dash-rec` ikkilamchi panel uslubi
- [x] `profile-completion` — portfolio_urls freelancer uchun

- [x] `landing_stat_commission_note` stats qatoridan olib tashlandi
- [x] `post_project_marketplace_hint` — loyiha vs xizmat ajratildi
- [x] `IshborProtectionStrip` — signature element (xizmat + buyurtma)
- [x] `ishbor-order-progress` — buyurtma stepper brend uslubi
- [x] Video qo'ng'iroq faqat `contractId` bilan (messages)
- [x] [public-pages-value-audit.md](./public-pages-value-audit.md) — 1.1 audit

- [x] Includes pipeline: migration + backend schema + barcha yaratish formalar (`onboarding`, `create-service`, `dashboard-new/edit`)
- [x] `pnpm db:push` — `20240629992000_service_includes.sql` qo'llandi

- [x] FAQ maydoni — `services.faq` jsonb, ixtiyoriy (4.2 to'liq)

**Oxirgi yangilanish:** 2026-06-10 — **product polish + 4.2 FAQ to'liq yakunlandi**

