---
name: ishbor-i18n
description: IshBor.uz ko'p tillilik tizimi — tarjima qo'shish va tuzatish. Use when adding UI text, fixing language issues, or working with src/infrastructure/i18n translations.
---

# IshBor i18n Skill

## O'qish tartibi
1. [AGENTS.md](../../AGENTS.md) — til qoidalari
2. `.cursor/rules/i18n.mdc`

## Fayl
`src/infrastructure/i18n/index.ts`

## Tez workflow

1. Kalit nomini tanla: `snake_case` (masalan `order_status_pending`)
2. Uch tilga qo'sh:
```typescript
// uz
order_status_pending: "Kutilmoqda",
// ru  
order_status_pending: "В ожидании",
// en
order_status_pending: "Pending",
```
3. Komponentda: `t('order_status_pending')`
4. Tekshir: `npx tsc --noEmit`

## Default til
`AppProvider` → `language: 'uz'`

## O'zbekcha qoidalar
- Lotin yozuvi, `o'` apostrof
- Valyuta: so'm, mln so'm
- Viloyat: `@/domain/constants/regions` dan, label: `t('region')`

## Xato oldini olish
- Kalitni faqat bitta marta yoz
- `ru`/`en` da ham borligini tekshir
- Hardcode matn qoldirma

## AppProvider tipi
```typescript
import type { TranslationKey } from '@/infrastructure/i18n'
t: (key: TranslationKey) => string
```
