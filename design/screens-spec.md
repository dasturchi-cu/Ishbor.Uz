# IshBor.uz — Screen Layout Specifications

> Figma Page 2 (Desktop 1440px) + Page 3 (Mobile 390px)  
> Komponentlar: `components-spec.md` | Tokenlar: `figma-tokens.json`

**Canvas layout:** Desktop frames 2 columns, 80px gap. Label above each frame (18px bold #64748B).

---

## SCREEN 1: Landing Page `/`

**Frame:** 1440 × ~5200px (auto height)

### Header (sticky, h 72px)

```
[Logo]     [Xizmatlar | Freelancerlar | Loyihalar | Blog]     [UZ RU EN] [Kirish] [Ro'yxatdan o'tish]
```

### Hero (gradient #EFF6FF → #FFFFFF, py 80px)

| Element | Spec |
|---------|------|
| Badge | "🚀 O'zbekiston #1 freelance platformasi", pill, bg #DBEAFE, border #BFDBFE |
| H1 | 48px, line2 "tez va xavfsiz" color #2563EB |
| Subtitle | 18px #64748B, mt 16px, max-w 560px centered |
| SearchBar hero | mt 32px, max-w 720px |
| Popular tags | mt 16px, pills: Logo dizayn · Web sayt · SMM · Tarjima · Video montaj · Python |
| Stats row | mt 48px, 3 cols with dividers: 12 000+ Xizmatlar \| 2 400+ Freelancerlar \| 0% Komissiya |

### Categories (mt 80px, max-w 1200px)

- H2 + "Barchasini ko'rish →" link
- Grid 4×2, gap 20px
- 8 category cards (see brief for emoji + counts)

### Featured Services (mt 80px)

- H2 + pill tabs: Barchasi | Dizayn | Dasturlash | SMM | Video
- Grid 4 cols, gap 20px, 8 ServiceCards

### How It Works (mt 80px, bg #F8FAFC, py 80px)

- H2 centered
- 3 steps horizontal, connector arrows
- Step circles 64px with numbered badge 01/02/03
- CTA "Hoziroq boshlash" primary lg centered, mt 48px

### Top Freelancers (mt 80px)

- H2 + horizontal scroll or 4-col grid
- 6 freelancer cards: avatar 64px PRO, name, title, rating, 3 skill pills, outline btn

### Testimonials (mt 80px)

- H2 "Mijozlar nima deydi?"
- 3 review cards, gap 24px, radius 16px, p 28px

### Trust (mt 80px, bg #0F172A, py 80px)

- H2 white centered
- 6-col icon grid (Escrow, Tez to'lov, Sertifikat, O'zbek tili, Click/Payme, 24/7)

### CTA Banner (mt 80px, mx 120px)

- Gradient #2563EB → #1D4ED8, radius 24px, p 64px
- 2 buttons: white filled + white outline

### Footer

- 4 columns + bottom bar (see components-spec SiteFooter)

---

## SCREEN 2: Services Catalog `/services`

**Frame:** 1440 × ~2400px

### Page title band (bg #F8FAFC, py 32px)

- Breadcrumb
- H1 "Xizmatlar"
- Category tabs underline style

### Main (max-w 1200px, gap 32px)

```
[Sidebar 280px sticky]  |  [Content flex-1]
```

#### Sidebar filters

1. Kategoriya — radio + count badges
2. Narx oralig'i — dual slider 0–5M, histogram bg
3. Freelancer darajasi — checkboxes
4. Yetkazish muddati — radio
5. Reyting — star options
6. Joylashuv — checkboxes

#### Content top bar

- "1 240 ta xizmat topildi"
- Filter chips with × + Tozalash
- Grid/List toggle + Sort dropdown

#### Grid

- 3 columns, gap 20px, 9 ServiceCards
- Skeleton state frame: 9 SkeletonCard
- Pagination centered bottom

---

## SCREEN 3: Service Detail `/services/[id]`

**Frame:** 1440 × ~2800px

### Breadcrumb

Bosh sahifa / Xizmatlar / Dizayn / Logo dizayn

### Layout 65% / 35%, gap 40px

#### Left

| Block | Spec |
|-------|------|
| Gallery | Main 100% × max 420px, radius 14px; thumbs 4×80px row gap 8px |
| Title | H2 |
| Meta | Badges + rating + order count |
| Seller mini-card | horizontal, avatar 48px PRO, stats, "Profil ko'rish →", online dot |
| Tabs | Tavsif \| Paketlar \| Sharhlar(128) \| Savol-javob |
| Tavsif | prose, checklist, skill pills, FAQ accordion |
| Reviews | summary bars + 6 ReviewCards |

#### Right sidebar (sticky top 96px)

- Card shadow-lg, radius 16px, p 24px
- Package tabs: Asosiy | Standart | Premium
- Price 28px bold #2563EB
- Delivery + revisions icons
- Included checklist
- "Buyurtma berish" primary lg full
- "Savol berish" outline full, mt 8px
- Escrow note 12px with Shield icon

---

## SCREEN 4: Freelancer Profile `/freelancer/[id]` ★ NEW

**Frame:** 1440 × ~3600px

### Hero band (bg #F8FAFC)

- Cover: 100% × 200px gradient (brand-100 → brand-50)
- Profile card overlapping cover bottom (-48px):
  - Avatar 96px, border 3px white, PRO badge
  - Online green dot + "Onlayn"
  - Name H2, title 16px muted, location, member since
  - Actions right: Xabar yuborish primary | Saqlash outline | Share icon

### Stats row (4 items, dividers)

4.9 Reyting | 128 Sharhlar | 1 240 Bajarilgan | 98% Qayta kelish

### Tabs

Haqida | Xizmatlar(24) | Portfel(18) | Sharhlar(128) | Ko'nikmalar

### Main 65% / Sidebar 35%

#### Left sections (stack, gap 48px)

1. **Haqida** — bio 3-4 lines + "Ko'proq ko'rish"
2. **Ixtisoslik** — SkillTag row
3. **Xizmatlarim** — 3-col compact ServiceCards (no thumb) + link
4. **Portfel** — masonry 3-col, hover overlay "Ko'rish"
5. **Tajriba & Ta'lim** — timeline with dots
6. **Sertifikatlar** — horizontal scroll cards
7. **Sharhlar** — rating summary + 4 ReviewCards

#### Sidebar sticky

- **Ish masalalari** card: 4 metric rows + 2 buttons
- **Languages** card: UZ/RU/EN levels
- **Shunga o'xshash** — 3 compact freelancer rows

**Demo profile:** Akbar Karimov, Senior Brand Designer & Frontend Developer, Toshkent

---

## SCREEN 5: Login `/login`

**Frame:** 1440 × 900px, split layout

### Left 45% (#1D4ED8)

- Logo white 28px
- Tagline white 70%
- 3 trust points with CheckCircle icons, mt 48px
- Testimonial card bottom absolute: white/10 blur, quote from Akbar K.

### Right 55%

- Form max-w 380px centered
- H2 "Xush kelibsiz" + subtitle
- Email + Password inputs with icons
- "Parolni unutdingiz?" link
- Kirish primary lg full
- Divider "yoki"
- Google outline full
- Register link bottom

---

## SCREEN 6: Register `/register`

**Frame A — Step 1:** 1440 × 800px centered

- Progress "1/2" pill
- H2 "Kimligingizni tanlang"
- 2 role cards side by side 560px max:
  - Freelancer (Briefcase blue) — selected state border 2px #2563EB
  - Mijoz (Users green)
- "Davom etish →" primary lg, disabled until selected

**Frame B — Step 2:** same split as Login

- Full name, Email, Password + strength bar, Confirm password
- Terms checkbox
- Ro'yxatdan o'tish primary full

---

## SCREEN 7: Dashboard Freelancer `/dashboard`

**Frame:** 1440 × 1200px

```
[Sidebar 256px] | [Main flex-1, p 32px]
```

### Main

- Header: H2 "Bosh sahifa" + date "8 Iyun, 2026, Dushanba" + bell badge 3
- Stats 4-col: Daromad | Faol buyurtmalar | Reyting | Profil ko'rishlar
- Grid 60/40:
  - Left: Faol buyurtmalar table (5 cols)
  - Right: Hamyon card + mini stats
- So'nggi faollik timeline (4 items)

---

## SCREEN 8: Dashboard Client `/dashboard/client`

Same shell, different sidebar nav:

- Freelancer topish, Buyurtmalarim, Saqlangan, Xabarlar

Stats: Jami | Yakunlangan | Jarayonda | Jami sarflangan

Active orders table with progress bar column

Recommended freelancers: 3 horizontal cards

---

## SCREEN 9: Messages `/messages`

**Frame:** 1440 × 900px

```
[Contact list 320px] | [Chat flex-1]
```

### Contact list

- Search top
- Filter tabs pill
- 6 conversation items (mix read/unread/active)

### Chat

- Header: avatar, name, Onlayn, action icons
- Messages: 8-10 bubbles, date divider "Bugun"
- Input bar: attach | emoji | input | send primary

---

## SCREEN 10: Notifications `/notifications`

**Frame:** 1440 × 1000px, content max-w 720px centered

- H2 + "Barchasini o'qildi deb belgilash"
- Filter tabs with counts
- Groups: Bugun (2 unread), Kecha (2 read)
- NotificationItem instances

---

## SCREEN 11: Settings `/settings`

**Frame:** 1440 × 1400px

```
[Nav 240px] | [Content flex-1, max-w 640px]
```

Nav: Profil | Xavfsizlik | Bildirishnomalar | To'lov | Til | Ko'rinish | Hisobni o'chirish

Content sections:

1. Asosiy — avatar upload + form fields
2. Joylashuv — 2 selects
3. Mutaxassislik — skills tags, level radio, rate input, languages

Save button right-aligned

---

## SCREEN 12: Wallet `/wallet`

**Frame:** 1440 × 1200px

- H2 "Hamyon"
- Balance hero card full-width gradient, 36px amount, USD hint, 2 buttons
- Payment methods: Click + Payme cards
- Transaction table with filter tabs + status badges

---

# MOBILE SCREENS (390 × 844)

**Frame wrapper:** iPhone 14 outline, status bar 47px, home indicator 34px  
**Canvas:** 3 columns × 4 rows, 48px gap

---

## M1: Landing Mobile

- Header: logo + hamburger (no center nav)
- Hero stacked, search full-width
- Stats 3-col compact
- Categories 2×4 grid
- Services single column ServiceCard
- Bottom: simplified footer accordion

---

## M2: Catalog Mobile

- Title + breadcrumb compact
- Sticky filter pill top-right with badge count
- Sort dropdown row
- Single column ServiceCard list
- Pagination compact

---

## M3: Service Detail Mobile

- Swipeable image gallery dots
- Horizontal scroll tabs
- Content full width
- **Sticky bottom bar:** price left + "Buyurtma berish" primary full height 56px + safe area

---

## M4: Freelancer Profile Mobile

- Cover 120px + avatar centered overlap
- Stats 2×2 grid
- Tabs horizontal scroll
- Sections stacked
- **Sticky bottom:** "Xabar yuborish" primary full

---

## M5: Login Mobile

- Logo + tagline top centered
- Form full width px 24
- No blue left panel (trust points as 3 compact rows below logo)

---

## M6: Register Mobile

- Step 1: role cards stacked vertically full width
- Step 2: same as login mobile form

---

## M7: Dashboard Mobile

- No sidebar
- Stats 2×2 grid
- Orders as stacked cards (not table)
- **Bottom tab bar** component fixed

---

## M8: Messages Mobile

**Frame A:** Contact list full screen  
**Frame B:** Chat full screen with back arrow

---

## M9: Settings Mobile

- Avatar centered top 80px
- Single column form sections
- Save button sticky bottom optional

---

## M10: Notifications Mobile

- Full screen list
- Swipe hint annotation on first item (left red "Dismiss" zone)

---

## M11: Bottom Tab Bar (component frame)

Standalone component showcase — 5 tabs, Xabarlar badge "2"

---

## M12: Hamburger Sheet

- Overlay 40% black
- Sheet 320px from right
- Full spec in components-spec

---

# DARK MODE FRAMES (Page 5)

Duplicate these 5 sections with dark tokens:

| Frame | Size | Key changes |
|-------|------|-------------|
| Landing Hero | 1440 × 800 | mesh-bg dark, text #F1F5F9 |
| ServiceCard | 280 × auto | bg #1E293B, border #334155 |
| Dashboard | 1440 × 900 | sidebar #1E293B, cards #1E293B |
| Freelancer Profile hero | 1440 × 600 | cover gradient dark |
| Messages | 1440 × 900 | bubbles #334155 / #3B82F6 |

Apply `.dark` token mapping from `figma-tokens.json` → `surface.dark.*`

---

# Prototype flows (Figma)

1. **Discovery:** Landing → Search → Catalog → Service Detail → Buyurtma
2. **Auth:** Landing → Kirish → Dashboard
3. **Register:** Ro'yxatdan o'tish → Role → Form → Dashboard
4. **Messaging:** Dashboard → Xabarlar → Conversation
5. **Mobile:** Hamburger → Nav item → Screen + Tab bar

---

# Real content reference

### Top freelancers (6)

| Name | Title | Rating | Skills |
|------|-------|--------|--------|
| Akbar Karimov | Senior Frontend Developer | 4.9 | React, Next.js, TypeScript |
| Zulfiya Mirzaeva | UI/UX Designer | 5.0 | Figma, Prototyping, Branding |
| Sardor Rahimov | SMM Specialist | 4.8 | Instagram, Telegram, TikTok |
| Nilufar Ochilov | Python Developer | 4.9 | Django, FastAPI, PostgreSQL |
| Jasur Toshmatov | Video Editor | 4.7 | Premiere Pro, After Effects |
| Malika Sobirov | Content Writer | 4.8 | Copywriting, SEO, UZ/RU |

### Categories (8)

Dizayn & Kreativ (340) · Dasturlash & Tech (280) · SMM & Marketing (195) · Kontent & Yozuv (160) · Video & Animatsiya (142) · Tarjima (98) · Biznes & Konsalting (87) · Musiqa & Audio (64)

### Testimonial quotes (3)

Use realistic Uzbek/Russian mix client roles: startup founder, marketing manager, small business owner.
