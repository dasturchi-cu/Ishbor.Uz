# IshBor.uz — Product Polish Checklist

> **Maqsad:** Loyihani "ishlaydigan MVP"dan "professional mahsulot" darajasiga olib chiqish.  
> **Yangi feature emas** — mavjud tajribani silliqlash, ishonch, IA va brend.  
> **Reja:** [product-polish-plan.md](./product-polish-plan.md)

---

## Holat

| Ko'rsatkich | Qiymat |
|-------------|--------|
| Jami yaxshilanish | **30** |
| Bajarilgan | **4** |
| Progress | **13%** |
| Oxirgi yangilanish | 2026-06-10 (Sprint 1) |

---

## 1. Product feeling (4)

### 1.1 Mahsulot identifikatsiyasi yo'q (IshBor vs Kwork clone + laboratoriya)

- [ ] Kwork nomlari va klasslarini IshBor dizayn tiliga o'tkazish (`kwork-*` → `ishbor-*` yoki neytral)
- [ ] Bitta asosiy mahsulot va'dasi qayd etilgan (masalan: fixed-price xizmatlar bozori)
- [ ] Jobs / companies / CV builder asosiy navdan olib tashlangan yoki "keyinroq" deb ajratilgan
- [ ] Har bir public sahifa "asosiy va'dani kuchaytadimi?" testidan o'tgan

### 1.2 Landing faqat mehmonlar uchun ✅

- [x] Login qilgandan keyin ham discovery-first bosh sahifa (shaxsiylashtirilgan katalog/qidiruv)
- [x] Dashboard = boshqaruv; marketplace = asosiy manzil — rollar aniq ajratilgan
- [x] `/` redirect o'rniga logged-in user uchun marketplace home ko'rsatiladi

### 1.3 Mahsulot o'ziga qarshi gapiradi ✅

- [x] Barcha user-facing matnlar bitta haqiqat darajasiga keltirilgan (sandbox vs #1 da'vo)
- [x] "Tez orada" matnlari marketing qatlamidan olib tashlangan yoki FAQ/status ga ko'chirilgan
- [x] Hero, pricing, auth, wallet, blog — bir xil xabar (nima ishlaydi / nima ishlamaydi)

### 1.4 "Coming soon" va waitlist mahsulot ichida

- [x] Faqat ishlaydigan narsalar marketing qilinadi
- [ ] Coming soon sahifalar asosiy navigatsiyadan olib tashlangan
- [x] Blog "yangiliklar" emas — "qo'llanma" yoki yashirilgan

---

## 2. UX hissiy muammolari (4)

### 2.1 Sandbox til foydalanuvchi qo'rquvini oshiradi ✅

- [x] User-facing til: "Mablag' himoyalangan" / "Ish qabul qilinmaguncha ushlab turiladi"
- [x] "Sandbox", "test rejim", "integratsiya jarayonida" user UI dan olib tashlangan
- [x] To'lov ishlamasa — aniq keyingi qadam, texnik tushuntirish emas

### 2.2 Xato va noaniq holatlar "sinovda" his qildiradi

- [x] `waitlist_saved_local` va infrastruktura xatolari userga ko'rinmaydi
- [x] Bo'sh testimonials/bloklar yo'qolmaydi — dizayn qilingan empty state
- [ ] Statistika yuklanmasa — "—" o'rniga to'liq empty treatment

### 2.3 Buyurtma flow "admin panel" emas, yo'l-yo'riq

- [ ] Har buyurtmada linear progress stepper (To'lov → Ish → Topshirish → Qabul)
- [ ] Har bosqichda bitta asosiy CTA + "nima bo'ladi" matni
- [ ] Status o'zgartirish ro'yxatdan detail sahifaga ko'chirilgan

### 2.4 Bannerlar va checklistlar haddan tashqari

- [ ] Bir vaqtda maksimum 1 ta global banner
- [ ] Onboarding checklist faqat dastlabki 3 sessiyada, keyin yo'qoladi
- [x] Referral banner har sahifada emas — alohida bo'limda

---

## 3. Information architecture (4)

### 3.1 Dashboard navigatsiyasi ERP kabi (12+ link) ✅

- [x] Nav 5 taga qisqartirilgan: Bosh, Buyurtmalar, Xabarlar, Pul, Profil
- [x] Escrow, contracts, analytics kontekstual (buyurtma ichidan)
- [x] "Escrow" alohida nav item emas — buyurtma atributi

### 3.2 Ikki xil bozor modeli aralashgan

- [ ] Asosiy IA bitta model atrofida (xizmat sotib olish YOKI loyiha joylash)
- [ ] Ikkinchi model navda kichik, aniq label ("Loyiha bozori")
- [ ] Jobs / CV uchinchi yo'nalish tashqi ko'rinishda yo'q

### 3.3 Interior / exterior nav yorilib ketgan

- [ ] Logged-in header qidiruv + kategoriyani saqlaydi
- [ ] Dashboard sidebar faqat "mening ishim"; global nav "bozor"

### 3.4 Terminologiya izchil emas

- [ ] Bitta termin lug'ati (Orders / Contracts / Birja / Loyihalar birlashtirilgan)
- [ ] UI da texnik so'zlar kamaytirilgan (escrow, ledger, contract)

---

## 4. Trust muammolari (4)

### 4.1 Ishonch bloklari bo'sh yoki yolg'on

- [x] `#1`, `0% komissiya`, Click/Payme, 24/7 — faqat isbotlangan da'volar qolgan
- [x] `TrustBrandLogos` bo'sh matn o'rniga haqiqiy partner logotiplari yoki butunlay olib tashlangan
- [ ] Ishonch raqamlari API dan keladi; bo'sh bo'lsa ko'rsatilmaydi

### 4.2 Har xizmatda bir xil "platforma standarti"

- [x] `SERVICE_INCLUDES` / `SERVICE_FAQ` shablonlari olib tashlangan
- [ ] Includes va FAQ faqat freelancer to'ldirganda ko'rsatiladi
- [ ] Xizmat yaratishda includes majburiy maydon

### 4.3 Ijtimoiy isbot yo'q bo'lganda sahifa "yarım"

- [x] Testimonials bo'sh bo'lsa — empty state, butun bo'lim yo'qolmaydi
- [ ] Kategoriya 0 count — yo'naltirilgan discovery (boshqa kategoriya / birinchi seller)
- [ ] Liquidity past bo'lsa ham minimum kuratsiyalangan vitrina

### 4.4 Blog o'z zaifligini e'lon qiladi ✅

- [x] Blog postlari roadmap emas — foydali qo'llanma
- [x] `blog_editorial_note` ("real yangiliklar tez orada") olib tashlangan
- [x] To'lov/escrow "keyin" haqidagi postlar user-facing dan olib tashlangan

---

## 5. Visual hierarchy (4)

### 5.1 Landing hero — hamma narsa bir xil muhim

- [ ] Hero da 1 ta primary action (qidiruv yoki "xizmat topish")
- [ ] Badge, shortcuts, trust strip, tags — scroll pastga yoki ikkilamchi
- [ ] Visual weight: H1 dominant, qolgani ikkilamchi

### 5.2 Dashboard — hamma panel bir xil karta

- [ ] Kunlik bitta focal widget ("Bugun 2 ta buyurtma kutilmoqda")
- [ ] Qolgan panellar ikkilamchi (kichikroq, kam border)
- [ ] Rang faqat actionable elementlarda

### 5.3 Service card — vizual boylik yetarli emas

- [ ] Thumbnail majburiy yoki kategoriya illustriatsiyasi
- [ ] Rating 0 → "Yangi freelancer" badge (bo'sh yulduz emas)
- [ ] Narx eng kuchli vizual element

### 5.4 11–12px disclaimer matnlar hamma joyda

- [x] `service_includes_general_note`, `escrow_steps_disclaimer` va sh.k. 80% kamaytirilgan
- [ ] Qolgan disclaimerlar FAQ / "Qanday ishlaydi" sahifasiga ko'chirilgan
- [ ] Asosiy UI faqat pozitiv xabar

---

## 6. User confidence (3)

### 6.1 Pul bilan bog'liq 3 ta alohida tushuncha

- [ ] Wallet + Payments + Escrow → bitta "Pul va to'lovlar" markazi
- [ ] Escrow buyurtma kontekstida: "$X ushlab turilmoqda"
- [x] Header wallet pill qoladi, lekin detail bitta joyda (nav birlashtirildi)

### 6.2 Xizmat sotib olishda nima bo'lishini ko'ra olmaydi

- [ ] Buyurtma berish ko'p bosqichli checkout (summary sidebar)
- [ ] Har bosqichda: narx, muddat, himoya, keyingi qadam
- [ ] Order modal → to'liq checkout experience

### 6.3 Profil va identifikatsiya zaif

- [ ] Verification badge faqat haqiqatan verified bo'lsa
- [ ] Portfolio bo'sh profil publish qilinmaydi yoki "to'ldirish kerak" holati
- [ ] "X yil platformada" — haqiqiy ma'lumot, default 1 emas

---

## 7. Marketplace feeling (3)

### 7.1 Supply zichligi ko'rinmaydi

- [ ] Liquidity past bo'lganda filterlar soddalashtirilgan
- [ ] "Trending" / "Yaqinda qo'shilgan" / "Tavsiya" bloklari (hatto 5 listing bilan)
- [ ] Empty catalog — yo'naltirilgan discovery, "0 natija" emas

### 7.2 Komissiya messaging natijadan ustun

- [x] Messaging: natija + vaqt + himoya (komissiya FAQ da bir marta)
- [ ] Service card: "3 kunda · 2 revision" komissiyadan muhimroq
- [x] Promo banner 10% komissiya o'rniga value proposition

### 7.3 Ikki tomonlama bozor dinamikasi yo'q

- [ ] Global activity strip (haqiqiy, anonymized: "Yangi xizmat", "Buyurtma bajarildi")
- [ ] Mavjud activity feed tashqi marketplace home ga chiqarilgan
- [ ] Bozor "jonli" hissi — statik katalog emas

---

## 8. Premium feeling (4)

### 8.1 Derivative dizayn (Kwork clone)

- [ ] Brand system sprint: rang, tipografiya, spacing — Kwork dan ajralish
- [ ] Signature element (masalan: escrow progress yoki O'zbekiston xaritasi)
- [ ] `KWORK_CATEGORY_ITEMS` va sh.k. nomlar IshBor brendiga mos

### 8.2 Marketing va app sifati farqi

- [ ] Dashboard spacing/radius/shadow landing bilan bir xil
- [ ] Bir design system — ikki yuz emas
- [ ] shadcn default ko'rinish dashboard dan olib tashlangan

### 8.3 Pro tier mavjud emas, UI da bor ✅

- [x] Pricing Pro rejimi yashirilgan yoki aniq "beta access"
- [x] `pricing_features_soon_note` user-facing dan olib tashlangan
- [x] Free tier to'liq professional ko'rinishda

### 8.4 Admin estetikasi user mahsulotiga siqib qolgan

- [ ] User UI oddiy til, oddiy flow
- [ ] Ledger, dispute evidence, call room — faqat kontekstda
- [ ] Enterprise modullar user mental modelidan ajratilgan

---

## Tez prioritet (birinchi 2 hafta)

1. [x] **2.1** — Sandbox tilini user UI dan olib tashlash
2. [x] **1.3** — Marketing matnlarini haqiqat bilan moslashtirish
3. [x] **4.1** — Yolg'on/bo'sh ishonch bloklarini olib tashlash
4. [x] **3.1** — Dashboard nav qisqartirish
5. [x] **4.2** — Service detail shablon includes/FAQ olib tashlash
6. [x] **1.2** — Logged-in marketplace home
7. [ ] **6.1** — Pul markazlarini birlashtirish
8. [ ] **8.1** — Kwork → IshBor vizual identifikatsiya

---

## Bog'liq hujjatlar

- [product-polish-plan.md](./product-polish-plan.md) — sprint rejasi
- [plan-status.md](../plan-status.md) — texnik holat
- [mvp.md](../mvp.md) — MVP tartibi
