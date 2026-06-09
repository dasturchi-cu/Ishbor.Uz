# IshBor.uz — Component Specifications

> Figma Page 4: 🧩 Components — variant matrix va pixel o'lchamlar  
> Tokenlar: `figma-tokens.json` | Umumiy qoidalar: `FIGMA-HANDOFF.md`

---

## Button

**Figma component name:** `Button`  
**Properties:** `Variant` | `Size` | `State` | `Layout` (optional: IconOnly, IconLeft, IconRight, TextOnly)

### Variant × Size matrix

| Variant | Size | H | px | Font | Radius | Icon |
|---------|------|---|-----|------|--------|------|
| Primary | sm | 32 | 12 | 13px | 6px | 14px |
| Primary | md | 40 | 16 | 14px | 10px | 16px |
| Primary | lg | 48 | 24 | 15px | 12px | 18px |
| Secondary | sm/md/lg | same | same | same | same | same |
| Outline | sm/md/lg | same | same | same | same | same |
| Ghost | sm/md/lg | same | same | same | same | same |
| Danger | sm/md/lg | same | same | same | same | same |
| Link | md only | auto | 0 | 14px | 0 | 16px |

### Variant colors (light mode)

| Variant | Default | Hover | Active | Disabled |
|---------|---------|-------|--------|----------|
| Primary | bg #2563EB, text white | bg #1D4ED8 | bg #1E40AF, scale 0.98 | bg #BFDBFE, text #93C5FD |
| Secondary | bg #F1F5F9, text #334155 | bg #E2E8F0 | scale 0.98 | opacity 0.45 |
| Outline | border 1px #CBD5E1, text #334155 | bg #F8FAFC, border #94A3B8 | scale 0.98 | opacity 0.45 |
| Ghost | text #64748B | bg #F1F5F9, text #334155 | scale 0.98 | opacity 0.45 |
| Danger | bg #DC2626, text white | bg #B91C1C | scale 0.98 | opacity 0.45 |
| Link | text #2563EB, underline on hover | text #1D4ED8 | — | opacity 0.45 |

### Loading state

- Spinner: 16px, Lucide `Loader2`, white (primary) or currentColor
- Text hidden, width preserved
- bg stays #2563EB (primary)

### Icon-only button

- Square: sm=32×32, md=40×40, lg=48×48
- Icon centered, no text

---

## Input / Form Fields

**Figma component name:** `Input`  
**Properties:** `State` | `Type` (Default, WithLabel, WithHelper, WithError, WithLeftIcon, WithRightIcon, WithPrefix, WithSuffixButton)

### Base specs

| Property | Value |
|----------|-------|
| Height | 40px |
| Radius | 10px |
| Border | 1px #E2E8F0 |
| BG | #FFFFFF |
| Padding | 0 12px |
| Font | 14px Regular, color #0F172A |
| Placeholder | #94A3B8 |

### States

| State | Border | Extra |
|-------|--------|-------|
| Default | #E2E8F0 | — |
| Focus | #2563EB | shadow-focus ring |
| Filled | #E2E8F0 | value visible |
| Error | #DC2626 | ring rgba(220,38,38,0.12) |
| Disabled | #E2E8F0 | bg #F8FAFC, text #94A3B8 |

### Label

- 13px Medium 500, #475569, mb 6px

### Helper / Error text

- 12px, helper #94A3B8, error #DC2626 + AlertCircle 14px icon

### Icon padding

- Left icon: pl 36px, icon 16px #94A3B8 at x=12
- Right icon: pr 36px

### Derived components

| Component | Extra specs |
|-----------|-------------|
| Select | ChevronDown 16px right, same height/radius |
| Textarea | min-height 100px, padding 12px, resize vertical |
| Search (hero) | inside SearchBar — see below |
| Search (compact) | h 36px, radius full, bg #F1F5F9, Cmd+K hint right |

---

## Badge / Tag

**Properties:** `Variant` | `Size` | `Style` (Default, WithDot, WithClose, WithIcon)

| Variant | BG | Text |
|---------|-----|------|
| default | #F1F5F9 | #475569 |
| primary | #DBEAFE | #1E3A5F |
| success | #DCFCE7 | #14532D |
| warning | #FEF3C7 | #92400E |
| error | #FEE2E2 | #7F1D1D |
| info | #DBEAFE | #1D4ED8 |
| outline | transparent, border #CBD5E1 | #475569 |
| dark | #1E293B | #F1F5F9 |

| Size | Font | px | py |
|------|------|-----|-----|
| xs | 10px | 6 | 2 |
| sm | 12px | 8 | 3 |
| md | 13px | 10 | 4 |

- Dot: 6px circle left, gap 6px
- Close: X 12px right, gap 4px
- Radius: full

---

## Avatar

**Properties:** `Size` | `Type` | `Status` | `Badge`

| Size | px |
|------|-----|
| 24, 32, 40, 48, 64, 80, 96, 120 | diameter |

### Types

- **Image:** circular, object-fit cover
- **Initials:** 2 chars, white text, bg from hash: #7C3AED | #059669 | #DC2626 | #D97706 | #0284C7 | #DB2777

### Status dot (bottom-right, on avatar edge)

| Status | Color | Size |
|--------|-------|------|
| Online | #16A34A | 8px (24–48), 10px (64+) |
| Away | #D97706 | same |
| Offline | #94A3B8 | same |

### PRO badge

- Bottom-right overlay, 16×16, bg #DCFCE7, text "Pro" 8px #14532D

### Avatar group

- Overlap -8px, max 4 visible, +N badge last

---

## Card

**Properties:** `Variant`

| Variant | Spec |
|---------|------|
| Default | bg white, border 1px #E2E8F0, radius 14px |
| Interactive | + hover: shadow-md, border #CBD5E1 |
| Featured | border 2px #2563EB, shadow-md |
| Danger | border 1px #FECACA |

Padding default: 16px (override per use)

---

## ServiceCard ★

**Properties:** `View` (Grid | List)

### Grid (280px wide)

See `FIGMA-HANDOFF.md` ASCII diagram.

| Zone | Spec |
|------|------|
| Thumbnail | 280×160, radius top 14px, gradient overlay bottom transparent→rgba(0,0,0,0.3) |
| Category badge | absolute top-left 8px, backdrop-blur, Badge primary sm |
| Bookmark btn | absolute top-right 8px, 32×32 circle, bg white/80, icon 16px |
| Seller row | py 12px px 14px, border-b 1px #F1F5F9, avatar 28px, name 13px/500 |
| Pro badge | right, Badge success sm |
| Title | px 14px py 10px, 14px/500, 2-line clamp #0F172A |
| Rating | px 14px, star #F59E0B, score 13px bold, count 12px #94A3B8 |
| Price row | border-t #F1F5F9, py 10px px 14px, "Dan:" 12px muted, price 16px bold, Button primary sm "Buyurtma" |

**Hover:** shadow-md, border #93C5FD

### List (100% width, horizontal)

```
[Thumb 200×120] | [Seller + Title + Rating] | [Price + Button]
```

- Thumb left, radius 14px
- Content flex-1, min-height 120px
- Price column right-aligned, w ~140px

---

## StatCard

**Properties:** `Variant` (Simple | Detailed)

### Simple

- bg #F8FAFC, radius 12px, padding 16px
- Icon 24px in 40px circle bg brand-50, icon color #2563EB
- Label 12px #64748B above
- Value 24px bold #0F172A below
- Trend optional: +12% ▲ #16A34A | -3% ▼ #DC2626, 12px

### Detailed

- Same + sparkline 60px height bottom + description 13px #64748B

---

## ReviewCard

- Avatar 40px + Name 14px bold + Date 12px #94A3B8 right
- Stars: 5×18px, filled #F59E0B, empty #E2E8F0
- Service link: 12px #64748B underline
- Review text: 14px, 3-line clamp
- Footer: "Foydali mi? 👍 12" 13px #64748B

---

## OrderStatusCard

- Status Badge top-right (success/warning/info)
- Order title 14px bold
- Freelancer: avatar 24px + name 13px
- Price 14px bold + deadline 12px muted with Clock icon
- Progress: track 4px #F1F5F9, fill by status color, % label right
- Actions: Button outline sm "Ko'rish" + Button ghost sm "Xabar yozish"

---

## NotificationItem

**Properties:** `State` (Read | Unread)

| State | BG | Extra |
|-------|-----|-------|
| Read | white | — |
| Unread | #EFF6FF | 8px blue dot right, left accent 3px #2563EB optional |

- Avatar/icon 40px left
- Title 14px bold + description 13px #64748B
- Time 12px #94A3B8 right
- Action link optional

---

## SkillTag

- Pill, border 1px #E2E8F0, bg #F8FAFC, text 13px #475569, px 12 py 6, radius full
- Hover: border #2563EB, bg #EFF6FF, text #1D4ED8
- Removable: X icon 14px right

---

## ProgressBar

**Properties:** `Variant` | `Style` (Default | WithLabel | WithSteps)

| Variant | Fill color |
|---------|------------|
| default | #2563EB |
| success | #16A34A |
| warning | #D97706 |
| error | #DC2626 |
| striped | #2563EB + diagonal stripes |

- Track: h 8px, bg #F1F5F9, radius full
- Label: "75%" 12px right or centered above

---

## RatingStars

**Properties:** `Size` | `Style` (StarsOnly | WithNumeric)

| Size | Star px |
|------|---------|
| sm | 14 |
| md | 18 |
| lg | 24 |

- Filled #F59E0B, half gradient, empty #E2E8F0
- Numeric: "4.9" bold + "(128 ta)" 12px muted

---

## Tabs

**Properties:** `Style` (Underline | Pill)

### Underline (primary)

- Tab items inline, gap 24px
- Active: text #2563EB weight 600, border-bottom 2px #2563EB
- Default: #64748B, hover #334155
- With count: "Arizalar (12)" — count in caption style

### Pill (secondary)

- Container: bg #F1F5F9, radius full, p 4px
- Active tab: bg white, shadow-sm, radius full, px 16 py 8px

---

## SearchBar

**Properties:** `Variant` (Hero | Compact)

### Hero (landing)

- Container: bg white, radius 14px, shadow-md, border 1px #E2E8F0, p 8px
- Total height: 60px
- Sections: [Search input flex-1] | divider 1px #E2E8F0 | [Location dropdown] | [Qidirish btn primary lg]
- Placeholder: "Xizmat yoki freelancer qidiring..."

### Compact (header)

- h 36px, radius full, bg #F1F5F9
- Search icon 16px left, "Qidirish..." placeholder
- Cmd+K hint 11px #94A3B8 right

---

## Breadcrumb

- Items: 14px, separator `/` or `›` #94A3B8
- Link: #64748B, hover #2563EB
- Current: #0F172A bold
- Mobile variant: show last 2 items only + "..." prefix

---

## Pagination

- Button size: 36×36, radius 8px
- Current: bg #2563EB, text white
- Others: transparent, hover bg #F1F5F9
- Prev/Next: text 14px + chevron

---

## EmptyState

**Properties:** `Variant` (NoServices | NoOrders | NoMessages | NoNotifications | NoSaved)

- Padding: 48px 24px, centered
- Icon/illustration: 64px #CBD5E1
- Title: 18px bold #334155
- Description: 14px #64748B, max-width 320px
- CTA: Button primary or outline optional

---

## Skeleton Loader

**Properties:** `Shape` (TextLine | Heading | Avatar | Button | ServiceCard | StatCard)

- bg #F1F5F9
- Shimmer: linear gradient animation left→right, white 40% opacity band
- ServiceCard skeleton: match 280×~340 proportions
- Duration: 1.5s infinite

---

## Header (Site)

**Component:** `SiteHeader` — instance on all public pages

| Zone | Width | Content |
|------|-------|---------|
| Container | max 1200px centered | — |
| Logo | auto | IshBor bold #2563EB + .uz #64748B, 20px |
| Nav center | flex | 4 links, active underline 2px |
| Right | auto | LanguagePill + 2 buttons |

Sticky: bg white/92% blur, shadow-sm on scroll

---

## Footer (Site)

**Component:** `SiteFooter`

- bg #0F172A, text white, py 64px 32px
- 4 columns, gap 48px
- Bottom bar: border-t white/10, pt 32px, flex between

---

## Dashboard Sidebar

**Component:** `DashboardSidebar` — w 256px

- User block: avatar 48px + name + role Badge success
- Online toggle: green dot + "Onlayn"
- Nav items: h 40px, radius 10px, active bg #EFF6FF text #2563EB
- Bottom: Yordam + Chiqish error color

---

## Mobile Bottom Tab Bar

**Component:** `MobileTabBar` — h 64px + safe area

| Tab | Icon | Label |
|-----|------|-------|
| Bosh sahifa | Home | 11px |
| Xizmatlar | Search | 11px |
| Buyurtmalar | ClipboardList | 11px |
| Xabarlar | MessageCircle | badge red |
| Profil | User | 11px |

Active: icon filled + label #2563EB

---

## Mobile Hamburger Sheet

- Width: 320px, slide from right
- Full height, bg white, shadow-lg
- Top: avatar 48px + name + email
- Nav links: 16px, py 16px, border-b #F1F5F9
- Language switcher row
- Dark mode toggle
- Logout: text #DC2626 bottom
