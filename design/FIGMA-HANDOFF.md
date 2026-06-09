# IshBor.uz — Figma Design Handoff

> **Tagline:** Top freelancerlar bilan ishlang — tez va xavfsiz  
> **Vibe:** Linear × Kwork — clean, warm, trustworthy, O'zbekiston uchun maxsus  
> **Code sync:** `src/presentation/styles/tokens.css` bilan 1:1 mos

---

## Cheklov va yechim

Cursor muhitida `.fig` faylini to'g'ridan-to'g'ri yaratib bo'lmaydi. Ushbu paket **production-ready Figma handoff** — tokenlar, komponent variantlari va barcha ekranlar o'lchamlari bilan. Figma'da 1–2 kun ichida pixel-perfect file yig'ish mumkin.

### Figma'da ochish (5 qadam)

1. Figma → **New design file** → nom: `IshBor.uz — Design System v1`
2. Plugin: **Tokens Studio for Figma** → Import → `.cursor/design/figma-tokens.json`
3. Sync tokens → Figma Variables (Color, Number, String)
4. Font: **Inter** (Google Fonts) — barcha text style'larga ulang
5. Icon: **Lucide** community kit yoki Iconify plugin → 24px grid

---

## Fayl strukturasi (5 sahifa)

| # | Sahifa nomi | Mazmun |
|---|-------------|--------|
| 1 | 🎨 Design System | Rang, tipografiya, spacing, radius, shadow, icon grid |
| 2 | 🖥️ Desktop Screens | 12 ta frame, 1440×auto, 2 ustun, 80px gap |
| 3 | 📱 Mobile Screens | 12 ta frame, 390×844, iPhone outline, 3×4 grid |
| 4 | 🧩 Components | Barcha komponentlar + variant matrix |
| 5 | 🌙 Dark Mode | 5 ta asosiy ekran dark versiyasi |

**Ish tartibi:** Page 4 (Components) → Page 1 (DS) → Page 2 (Desktop) → Page 3 (Mobile) → Page 5 (Dark)

---

## Page 1 — Design System

### Color swatches (80×80px + hex label)

**Brand Blue** — `#2563EB` ★ primary belgisi bilan  
`#EFF6FF` `#DBEAFE` `#BFDBFE` `#93C5FD` `#60A5FA` `#3B82F6` `#2563EB★` `#1D4ED8` `#1E40AF` `#1E3A5F`

**Neutral** — 11 ta swatch  
`#FFFFFF` → `#0F172A`

**Semantic pills** (icon + label, radius full, px 12 py 6):

| Token | BG | Text | Border |
|-------|-----|------|--------|
| Success | #DCFCE7 | #14532D | #16A34A |
| Warning | #FEF3C7 | #92400E | #D97706 |
| Error | #FEE2E2 | #7F1D1D | #DC2626 |
| Info | #DBEAFE | #1E3A5F | #2563EB |

### Typography (namuna matn)

> IshBor.uz platformasida eng yaxshi freelancerlarni toping

| Style | Size | Weight | Tracking | LH |
|-------|------|--------|----------|-----|
| Display | 48 | 700 | -0.03em | 1.1 |
| H1 | 36 | 700 | -0.02em | 1.15 |
| H2 | 28 | 600 | -0.01em | 1.2 |
| H3 | 22 | 600 | 0 | 1.3 |
| H4 | 18 | 500 | 0 | 1.4 |
| Body L | 16 | 400 | 0 | 1.65 |
| Body M | 14 | 400 | 0 | 1.6 |
| Body S | 13 | 400 | 0 | 1.5 |
| Caption | 12 | 400 | 0 | 1.4 (#94A3B8) |
| Overline | 11 | 600 | +0.06em | 1 UPPERCASE |

### Spacing bars

`4 8 12 16 20 24 32 40 48 64 80 96` px — horizontal bar + label

### Border radius

`xs=4 sm=6 md=10 lg=14 xl=20 2xl=28 full=9999`

### Shadows (oq kartada)

`none | xs | sm | md | lg | focus` — qiymatlar `figma-tokens.json` da

### Icons (Lucide 24px grid)

Home, Search, Star, Bookmark, Heart, Share2, MessageCircle, Bell, Settings, User, Users, Briefcase, Package, ShoppingBag, Wallet, CreditCard, CheckCircle, XCircle, AlertCircle, Info, ChevronDown, ChevronRight, ArrowRight, Plus, Minus, Edit, Trash2, Upload, Download, Eye, EyeOff, Lock, Mail, Phone, MapPin, Clock, Calendar, Tag, Filter, SlidersHorizontal, Grid, List, Globe, Flag, Zap, Shield, Award, TrendingUp, BarChart2

---

## Page 4 — Components (batafsil: `components-spec.md`)

Har bir komponent **Figma Component** + **Variants**. Naming: `Component/Variant=Primary, Size=Medium, State=Default`

### Asosiy komponentlar ro'yxati

| Komponent | Variantlar | Priority |
|-----------|------------|----------|
| Button | 6×3×5 + icon layouts | ★★★ |
| Input | 5 state + label/helper/error/icon/prefix/suffix | ★★★ |
| Select, Textarea, Search | Input'dan derive | ★★ |
| Badge/Tag | 8 variant × 3 size + dot/close/icon | ★★ |
| Avatar | 8 size × image/initials/status/pro/group | ★★ |
| Card | default/interactive/featured/danger | ★★ |
| **ServiceCard** | grid + list view | ★★★★★ |
| StatCard | simple + detailed | ★★ |
| ReviewCard | — | ★★ |
| OrderStatusCard | — | ★★ |
| NotificationItem | read/unread | ★★ |
| SkillTag | default + removable | ★ |
| ProgressBar | 5 variant + steps | ★ |
| RatingStars | sm/md/lg + numeric | ★★ |
| Tabs | underline + pill + count | ★★ |
| SearchBar | hero + compact | ★★★ |
| Breadcrumb | desktop + mobile | ★ |
| Pagination | — | ★ |
| EmptyState | 5 illustration variant | ★★ |
| Skeleton | 6 shape variant | ★★ |

### ServiceCard — eng muhim (280px)

```
┌─────────────────────────────┐  w=280
│ [Thumbnail 280×160]         │  radius top 14px, gradient overlay bottom
│  [category badge TL] [♡ TR] │
├─────────────────────────────┤  seller row: py=12 px=14, border-b #F1F5F9
│ [Avatar 28] Name      [Pro] │
├─────────────────────────────┤  title: 14px/500, 2-line clamp, px=14
│ Service title...            │
├─────────────────────────────┤  rating: px=14
│ ⭐ 4.9 (128 ta sharh)       │
├─────────────────────────────┤  price: border-t, py=10 px=14
│ Dan: 150 000 so'm  [Buyurtma]│  btn primary sm
└─────────────────────────────┘
Hover: shadow-md, border #93C5FD
```

**Demo ma'lumotlar (8 ta card):**

1. Professional logo va brend identifikatsiya — Akbar K. — 4.9 — 150 000 so'm
2. Next.js web sayt ishlab chiqaman — Zulfiya M. — 5.0 — 500 000 so'm
3. Instagram SMM va kontent yaratish — Sardor R. — 4.8 — 200 000 so'm
4. UX/UI Figma prototip — Nilufar O. — 4.9 — 350 000 so'm
5. Python bot yozaman — Jasur T. — 4.7 — 300 000 so'm
6. Video montaj professional — Malika S. — 4.8 — 180 000 so'm
7. Tarjima UZ/RU/EN — Bobur A. — 5.0 — 80 000 so'm
8. 1C dasturi sozlash — Kamola N. — 4.6 — 400 000 so'm

---

## Page 2 — Desktop Screens (1440px)

Batafsil layout: `screens-spec.md`

| # | Frame nomi | Route | Asosiy bloklar |
|---|------------|-------|----------------|
| 1 | Landing | `/` | Hero, categories 4×2, services 4-col, how-it-works, freelancers, reviews, trust dark, CTA, footer |
| 2 | Services Catalog | `/services` | Sidebar 280px filters + 3-col grid |
| 3 | Service Detail | `/services/[id]` | Gallery 65% + sticky package sidebar 35% |
| 4 | Freelancer Profile | `/freelancer/[id]` | Cover hero, tabs, portfolio masonry |
| 5 | Login | `/login` | Split 45/55 blue panel + form |
| 6 | Register | `/register` | Step 1 role cards + Step 2 form |
| 7 | Dashboard Freelancer | `/dashboard` | Sidebar 256px + stats + orders table |
| 8 | Dashboard Client | `/dashboard/client` | Different nav + recommended freelancers |
| 9 | Messages | `/messages` | 320px list + chat |
| 10 | Notifications | `/notifications` | 720px centered list |
| 11 | Settings | `/settings` | 240px nav + profile form |
| 12 | Wallet | `/wallet` | Balance hero + transactions |

### Umumiy header (barcha public sahifalar)

- Max-width 1200px centered
- Logo: **IshBor** bold #2563EB + **.uz** #64748B
- Nav: Xizmatlar | Freelancerlar | Loyihalar | Blog
- Right: Language pill [UZ][RU][EN] + Kirish ghost + Ro'yxatdan o'tish primary

### Umumiy footer

- bg #0F172A, 4 column, © 2026, Click + Payme logos

---

## Page 3 — Mobile (390×844, iPhone frame)

| # | Screen | Maxsus |
|---|--------|--------|
| 1 | Landing mobile | Hamburger, stacked hero, 2×4 categories |
| 2 | Catalog mobile | Filter pill sticky, single column |
| 3 | Service detail | Sticky bottom CTA bar |
| 4 | Freelancer profile | Sticky "Xabar yuborish" bar |
| 5 | Login | Full-width, no split |
| 6 | Register step 1 | Stacked role cards |
| 7 | Dashboard | 2×2 stats, bottom tab bar |
| 8 | Messages | List → full chat |
| 9 | Settings | Centered avatar |
| 10 | Notifications | Swipe hint |
| 11 | Bottom tab bar | 5 tabs component |
| 12 | Hamburger sheet | Right panel, lang + dark toggle |

---

## Page 5 — Dark Mode

| Light token | Dark token |
|-------------|------------|
| bg #FFFFFF | #0F172A |
| bg-subtle #F8FAFC | #1E293B |
| bg-muted #F1F5F9 | #334155 |
| border #E2E8F0 | #334155 |
| text #0F172A | #F1F5F9 |
| primary #2563EB | #3B82F6 |
| primary-light #EFF6FF | #1E3A5F |

**Dark versiyalar:** Landing hero, ServiceCard, Dashboard, Freelancer profile, Messages

---

## Interaction annotations (Figma'da Prototype + Notes)

| State | Visual |
|-------|--------|
| Hover | Ochiqroq bg yoki shadow-md; label: "hover" |
| Focus | 3px blue ring `shadow-focus`, radius match |
| Active | scale 0.98, darker bg |
| Disabled | opacity 0.45, cursor not-allowed |
| Loading | Spinner 16px yoki skeleton shimmer |

---

## Content qoidalari

- **Valyuta:** `350 000 so'm` (space separator, `$` emas)
- **Sana:** `8 Iyun, 2026, Dushanba` (o'zbekcha)
- **Ismlar:** Akbar Karimov, Zulfiya Mirzaeva, Sardor Rahimov, Nilufar Ochilov, Jasur Toshmatov, Malika Sobirov, Bobur Alimov, Kamola Nazarova, Sherzod Yusupov
- **Kontrast:** minimum 4.5:1
- **Spacing:** faqat 4px grid
- **Komponentda max 3 font size**

---

## Quality checklist (Figma'da tugatishdan oldin)

- [ ] Har komponent: default, hover, focus, disabled
- [ ] Barcha matnlar o'qiladi (4.5:1)
- [ ] Mobile horizontal scroll yo'q
- [ ] Empty state: illustration + message + CTA
- [ ] List loading: skeleton (spinner emas)
- [ ] ServiceCard grid + list variant
- [ ] Dark mode 5 ta ekran
- [ ] Prototype: Landing → Catalog → Detail → Order flow

---

## Code ↔ Figma sync

| Figma | Code |
|-------|------|
| `{IshBor.color.brand.600}` | `--brand-600` / `--color-primary` |
| `{IshBor.radius.lg}` | `--r-lg` (14px) |
| `{IshBor.shadow.md}` | `--shadow-md` |
| Button Primary/md | `Button variant="primary" size="md"` |
| ServiceCard | `src/presentation/components/features/service-card.tsx` |

Kod yangilanganda avval `tokens.css`, keyin Tokens Studio sync.

---

## Fayllar

| Fayl | Maqsad |
|------|--------|
| `figma-tokens.json` | Tokens Studio import |
| `components-spec.md` | Variant matrix + o'lchamlar |
| `screens-spec.md` | Har ekran layout spec |
| `FIGMA-HANDOFF.md` | Ushbu hujjat |
