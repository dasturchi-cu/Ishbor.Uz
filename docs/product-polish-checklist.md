# IshBor.uz — Product Polish Checklist

> **Maqsad:** Loyihani "ishlaydigan MVP"dan "professional mahsulot" darajasiga olib chiqish.  
> **Yangi feature emas** — mavjud tajribani silliqlash, ishonch, IA va brend.  
> **Reja:** [product-polish-plan.md](./product-polish-plan.md)

---

## Holat

| Ko'rsatkich | Qiymat |
|-------------|--------|
| Jami yaxshilanish | **30** |
| Bajarilgan | **30** |
| Progress | **100%** |
| Oxirgi yangilanish | 2026-06-10 (product polish yakunlandi) |

---

## 1. Product feeling (4)

### 1.1 Mahsulot identifikatsiyasi yo'q (IshBor vs Kwork clone + laboratoriya)

- [x] `--ishbor-*` CSS token aliaslari qo'shildi (`kwork-*` legacy alias sifatida)
- [x] `kwork-*` CSS klasslari to'liq `ishbor-*` ga migratsiya (tsx/css da `kwork-` qolmagan)
- [x] Bitta asosiy mahsulot va'dasi qayd etilgan ("24 soat ichida mutaxassis" + escrow)
- [x] Jobs / companies roadmap banner + waitlist olib tashlandi; asosiy navda yo'q
- [x] Har bir public sahifa "asosiy va'dani kuchaytadimi?" testidan o'tgan ([public-pages-value-audit.md](./public-pages-value-audit.md))

### 1.2 Landing faqat mehmonlar uchun ✅

- [x] Login qilgandan keyin ham discovery-first bosh sahifa (shaxsiylashtirilgan katalog/qidiruv)
- [x] Dashboard = boshqaruv; marketplace = asosiy manzil — rollar aniq ajratilgan
- [x] `/` redirect o'rniga logged-in user uchun marketplace home ko'rsatiladi
- [x] Login/onboarding tugagach default manzil `/` (dashboard emas)

### 1.3 Mahsulot o'ziga qarshi gapiradi ✅

- [x] Barcha user-facing matnlar bitta haqiqat darajasiga keltirilgan (sandbox vs #1 da'vo)
- [x] "Tez orada" matnlari marketing qatlamidan olib tashlangan yoki FAQ/status ga ko'chirilgan
- [x] Hero, pricing, auth, wallet, blog — bir xil xabar (nima ishlaydi / nima ishlamaydi)

### 1.4 "Coming soon" va waitlist mahsulot ichida ✅

- [x] Faqat ishlaydigan narsalar marketing qilinadi
- [x] Blog va pricing asosiy header navdan olib tashlangan (footerda qoladi)
- [x] Blog "yangiliklar" emas — "qo'llanma" yoki yashirilgan

---

## 2. UX hissiy muammolari (4)

### 2.1 Sandbox til foydalanuvchi qo'rquvini oshiradi ✅

- [x] User-facing til: "Mablag' himoyalangan" / "Ish qabul qilinmaguncha ushlab turiladi"
- [x] "Sandbox", "test rejim", "integratsiya jarayonida" user UI dan olib tashlangan
- [x] To'lov ishlamasa — aniq keyingi qadam, texnik tushuntirish emas

### 2.2 Xato va noaniq holatlar "sinovda" his qildiradi ✅

- [x] `waitlist_saved_local` va infrastruktura xatolari userga ko'rinmaydi
- [x] Bo'sh testimonials/bloklar yo'qolmaydi — dizayn qilingan empty state
- [x] Statistika 0 bo'lsa ko'rsatilmaydi (LandingStatsRow yashiriladi)

### 2.3 Buyurtma flow "admin panel" emas, yo'l-yo'riq ✅

- [x] Har buyurtmada linear progress stepper (To'lov → Ish → Topshirish → Qabul)
- [x] Har bosqichda bitta asosiy CTA + "nima bo'ladi" matni
- [x] Status o'zgartirish ro'yxatdan detail sahifaga ko'chirilgan

### 2.4 Bannerlar va checklistlar haddan tashqari ✅

- [x] Bir vaqtda maksimum 1 ta global banner (dashboard: to'lov > sharh > yaratildi)
- [x] Onboarding checklist faqat dastlabki 3 sessiyada, keyin yo'qoladi
- [x] Referral banner har sahifada emas — alohida bo'limda

---

## 3. Information architecture (4)

### 3.1 Dashboard navigatsiyasi ERP kabi (12+ link) ✅

- [x] Nav 5 taga qisqartirilgan: Bosh, Buyurtmalar, Xabarlar, Pul, Profil
- [x] Escrow, contracts, analytics kontekstual (buyurtma ichidan)
- [x] "Escrow" alohida nav item emas — buyurtma atributi

### 3.2 Ikki xil bozor modeli aralashgan ✅

- [x] Asosiy IA: xizmatlar birinchi; loyiha bozori ikkinchi (`post_project_marketplace_hint`)
- [x] Ikkinchi model navda kichik, aniq label ("Loyiha bozori")
- [x] Jobs / CV uchinchi yo'nalish header navda yo'q

### 3.3 Interior / exterior nav yorilib ketgan ✅

- [x] Logged-in header qidiruv + kategoriyani saqlaydi
- [x] Dashboard sidebar faqat "mening ishim"; global nav "bozor"

### 3.4 Terminologiya izchil emas ✅

- [x] `nav_birja` → `nav_project_marketplace` (header mobile); birja matni yumshatildi
- [x] Termin lug'ati: `src/domain/constants/terminology.ts` + [terminology-glossary.md](./terminology-glossary.md)
- [x] UI da texnik so'zlar kamaytirilgan (escrow, ledger, contract)

---

## 4. Trust muammolari (4)

### 4.1 Ishonch bloklari bo'sh yoki yolg'on ✅

- [x] `#1`, `0% komissiya`, Click/Payme, 24/7 — faqat isbotlangan da'volar qolgan
- [x] `TrustBrandLogos` bo'sh matn o'rniga haqiqiy partner logotiplari yoki butunlay olib tashlangan
- [x] Ishonch raqamlari API dan keladi; bo'sh bo'lsa ko'rsatilmaydi

### 4.2 Har xizmatda bir xil "platforma standarti"

- [x] `SERVICE_INCLUDES` / `SERVICE_FAQ` shablonlari olib tashlangan
- [x] Includes faqat freelancer to'ldirganda ko'rsatiladi (`service-detail` + API `includes`)
- [x] Xizmat yaratishda includes majburiy maydon (`dashboard-new-service-page` + backend schema)
- [x] FAQ faqat freelancer to'ldirganda ko'rsatiladi (`services.faq` jsonb + `service-detail`)

### 4.3 Ijtimoiy isbot yo'q bo'lganda sahifa "yarım" ✅

- [x] Testimonials bo'sh bo'lsa — empty state, butun bo'lim yo'qolmaydi
- [x] Kategoriya 0 count — "Ko'rish" CTA (category_explore_cta)
- [x] Liquidity past bo'lsa ham minimum kuratsiyalangan vitrina (top_services + yangi sort)

### 4.4 Blog o'z zaifligini e'lon qiladi ✅

- [x] Blog postlari roadmap emas — foydali qo'llanma
- [x] `blog_editorial_note` ("real yangiliklar tez orada") olib tashlangan
- [x] To'lov/escrow "keyin" haqidagi postlar user-facing dan olib tashlangan

---

## 5. Visual hierarchy (4)

### 5.1 Landing hero — hamma narsa bir xil muhim ✅

- [x] Hero da 1 ta primary action (qidiruv — browse tugmasi olib tashlandi)
- [x] Badge, shortcuts, trust strip, tags — ikkilamchi qatlam (landing-hero-secondary)
- [x] Visual weight: H1 + qidiruv dominant, qolgani ikkilamchi

### 5.2 Dashboard — hamma panel bir xil karta ✅

- [x] Kunlik bitta focal widget (dash_focal_pay / dash_focal_orders)
- [x] `dashboard-panel--secondary` — activity va tavsiya panellari ikkilamchi
- [x] `dash-kpi--muted`, `dash-rec` va stat-card ikkilamchi vizual og'irlik

### 5.3 Service card — vizual boylik yetarli emas ✅

- [x] Thumbnail majburiy yoki kategoriya illustriatsiyasi
- [x] Rating 0 → "Yangi freelancer" badge (bo'sh yulduz emas)
- [x] Narx eng kuchli vizual element (primary rang)

### 5.4 11–12px disclaimer matnlar hamma joyda ✅

- [x] `service_includes_general_note`, `escrow_steps_disclaimer` va sh.k. 80% kamaytirilgan
- [x] Buyurtma to'lov blokida komissiya tafsilotlari → `payment_checkout_summary` + himoya linki
- [x] Landing stats qatoridagi `landing_stat_commission_note` olib tashlandi
- [x] Dashboard `client_stat_spent_note` olib tashlandi

---

## 6. User confidence (3)

### 6.1 Pul bilan bog'liq 3 ta alohida tushuncha ✅

- [x] Wallet + Payments + Escrow → bitta "Pul va to'lovlar" markazi
- [x] Escrow buyurtma kontekstida: "$X ushlab turilmoqda"
- [x] Header wallet pill qoladi, lekin detail bitta joyda (nav birlashtirildi)

### 6.2 Xizmat sotib olishda nima bo'lishini ko'ra olmaydi ✅

- [x] Buyurtma berish 3 bosqichli checkout (`ServiceOrderCheckout`)
- [x] Har bosqichda: narx, muddat, himoya, keyingi qadam
- [x] Order modal → stepper + summary strip + tasdiqlash

### 6.3 Profil va identifikatsiya zaif ✅

- [x] Verification badge faqat haqiqatan verified bo'lsa (isPro ≠ verified)
- [x] Portfolio bo'sh — EmptyState + to'ldirish CTA + `profile-completion` da `portfolio_urls`
- [x] "X yil platformada" — faqat created_at bo'lsa ko'rsatiladi

---

## 7. Marketplace feeling (3)

### 7.1 Supply zichligi ko'rinmaydi ✅

- [x] Liquidity past bo'lganda filterlar soddalashtirilgan (<8 xizmat: region/daraja yashiriladi)
- [x] "Yaqinda qo'shilgan" sort + landing top_services vitrina
- [x] Empty catalog — yo'naltirilgan discovery (freelancer / loyiha CTA)

### 7.2 Komissiya messaging natijadan ustun ✅

- [x] Messaging: natija + vaqt + himoya (komissiya FAQ da bir marta)
- [x] Service card: muddat meta (service_card_delivery_meta) escrow badgedan ustun
- [x] Promo banner 10% komissiya o'rniga value proposition

### 7.3 Ikki tomonlama bozor dinamikasi yo'q ✅

- [x] Global activity strip (MarketplacePulse — haqiqiy stats, yolg'on vaqt yo'q)
- [x] `LandingRecentActivity` — `/stats/public` recent_activity marketplace home da
- [x] Bozor "jonli" hissi — pulse + top_services rotatsiyasi

---

## 8. Premium feeling (4)

### 8.1 Derivative dizayn (Kwork clone)

- [x] Brand system sprint: `--ishbor-*` tokenlar + `ishbor-*` klass migratsiyasi (signature element hali yo'q)
- [x] Signature element — `IshborProtectionStrip` (xizmat + buyurtma) + `ishbor-order-progress`
- [x] `ISHBOR_CATEGORY_ITEMS` alias qo'shildi (KWORK → migratsiya boshlandi)

### 8.2 Marketing va app sifati farqi

- [x] Dashboard stat-card shadow/radius landing `surface-panel` ga yaqinlashtirildi
- [x] Bir design system — `surface-panel` buyurtma detali + dashboard tokenlari
- [x] shadcn default ko'rinish kamaytirildi — `surface-panel`, `dashboard-panel--secondary`

### 8.3 Pro tier mavjud emas, UI da bor ✅

- [x] Pricing Pro rejimi yashirilgan yoki aniq "beta access"
- [x] `pricing_features_soon_note` user-facing dan olib tashlangan
- [x] Free tier to'liq professional ko'rinishda

### 8.4 Admin estetikasi user mahsulotiga siqib qolgan

- [x] User UI oddiy til — `dispute_view_details` yumshatildi, sandbox matnlar olib tashlandi
- [x] Video qo'ng'iroq faqat shartnoma chatida (`messages-page` + `contractId`)
- [x] Escrow/analytics/ledger alohida nav emas — faqat buyurtma/wallet konteksti

---

## Tez prioritet (birinchi 2 hafta)

1. [x] **2.1** — Sandbox tilini user UI dan olib tashlash
2. [x] **1.3** — Marketing matnlarini haqiqat bilan moslashtirish
3. [x] **4.1** — Yolg'on/bo'sh ishonch bloklarini olib tashlash
4. [x] **3.1** — Dashboard nav qisqartirish
5. [x] **4.2** — Service detail shablon includes/FAQ olib tashlash
6. [x] **1.2** — Logged-in marketplace home
7. [x] **6.1** — Pul markazlarini birlashtirish
8. [x] **8.1** — Kwork → IshBor vizual identifikatsiya (klass + token migratsiya)

---

## Bog'liq hujjatlar

- [product-polish-plan.md](./product-polish-plan.md) — sprint rejasi
- [plan-status.md](../plan-status.md) — texnik holat
- [mvp.md](../mvp.md) — MVP tartibi
