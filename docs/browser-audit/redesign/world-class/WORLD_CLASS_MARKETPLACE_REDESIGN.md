# World-Class Marketplace Redesign (v3)

**Date:** 2026-06-12  
**Benchmark:** Fiverr · Upwork · Kwork · Contra  
**Verified:** Playwright MCP screenshots + Chrome DevTools Lighthouse

---

## Competitive lens

| Platform | Why users trust / convert / stay |
|----------|----------------------------------|
| **Fiverr** | Escrow badges above fold, category clarity on cards, pill trust row, polished card shadows |
| **Upwork** | Budget-first project rows, strong CTA on right rail, filter toolbar as command bar |
| **Kwork** | Category icon scroll, price-dominant card footer, dense but scannable grids |
| **Contra** | Premium whitespace, soft gradients, minimal chrome, portfolio-first hierarchy |

### IshBor gaps (pre-v3)

- Trust signals buried in text-only hero line
- Discover nav wrapped awkwardly on mobile
- Project cards lacked Upwork-style budget pill + primary CTA
- Service cards missing category badge on imagery (Fiverr pattern)
- Footer trust isolated in one column, not site-wide ribbon
- Catalog toolbar visually flat vs. world-class command bars

---

## v3 implementation

### New stylesheet

`src/presentation/styles/marketplace-world-class.css` — layered on `marketplace-visual-v2.css`

| Area | Change |
|------|--------|
| **Hero** | Triple trust badge row (escrow · verified · secure) with horizontal scroll |
| **Discover nav** | `discover-nav-scroll` — snap scroll on mobile |
| **Command bar** | Elevated white toolbar for search + sort + filters |
| **Search panel** | Deeper shadow, hover states on suggestions |
| **Category chips** | Snap scroll, active elevation |
| **Service cards** | Category pill on image (glass overlay) |
| **Project cards** | Budget pill + filled CTA button |
| **Trust strip** | Horizontal scroll on narrow viewports |
| **Footer** | Trust ribbon above grid |
| **Landing search** | Taller hero search with primary glow |

### Component updates

- `marketplace-catalog-hero.tsx` — Fiverr-style trust badge row
- `marketplace-discover-nav.tsx` — scroll wrapper
- `service-card.tsx` — category label on media
- `project-card.tsx` — Upwork-style aside
- `footer.tsx` — trust ribbon
- `services-catalog.tsx` — sort `aria-labelledby` (a11y)
- `site-layout.tsx` — imports v3 CSS

---

## Visual verification

Screenshots: `docs/browser-audit/redesign/world-class/`

| Page | Desktop | Mobile |
|------|---------|--------|
| Home | `home-desktop.png` | — |
| Services | `services-desktop.png` | `services-mobile.png` |
| Freelancers | `freelancers-desktop.png` | — |
| Projects | `projects-desktop.png` | — |
| Jobs | `jobs-desktop.png` | — |
| Companies | `companies-desktop.png` | — |

### Lighthouse (Chrome DevTools MCP)

| Page | Device | A11y | Best Practices | SEO |
|------|--------|------|----------------|-----|
| Home | Mobile | 95 | 100 | 100 |
| Services | Desktop | 95 | 100 | 100 |

---

## Remaining polish (post-v3)

1. **Content density** — seed real services/freelancers (DB has placeholder data)
2. **Landing hydration** — fix SSR/client mismatch for hero stats card
3. **Companies nav** — add to `MarketplaceDiscoverNav` when product-ready
4. **Filter drawer** — mobile bottom-sheet pattern (Fiverr) vs. current modal
5. **Logged-in surfaces** — dashboard marketplace widgets to match v3 tokens

---

## Files changed

```
src/presentation/styles/marketplace-world-class.css          (new)
src/presentation/components/layout/site-layout.tsx
src/presentation/components/layout/marketplace-catalog-hero.tsx
src/presentation/components/layout/marketplace-discover-nav.tsx
src/presentation/components/layout/footer.tsx
src/presentation/components/features/service-card.tsx
src/presentation/components/features/project-card.tsx
src/presentation/features/catalog/services-catalog.tsx
```
