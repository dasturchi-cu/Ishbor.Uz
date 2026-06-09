# IshBor.uz — UI terminologiya lug'ati

> Foydalanuvchi ko'radigan matnlarda izchillik uchun. Agent va copy yangilanishlarida shu jadvalga amal qiling.

## Asosiy modellar

| Kontekst | O'zbek (default) | Rus | Ingliz | Izoh |
|----------|------------------|-----|--------|------|
| Fixed-price xizmatlar | Xizmatlar | Услуги | Services | Asosiy marketplace modeli |
| Loyiha bozori | Loyiha bozori | Биржа проектов | Project marketplace | Ikkinchi model; **«Birja»** user UI da ishlatilmaydi |
| Buyurtma | Buyurtma | Заказ | Order | Xizmatdan yaratilgan tranzaksiya |
| Shartnoma | Shartnoma | Контракт | Contract | Loyiha asosidagi kelishuv (faqat kontekstda) |

## Pul va himoya

| Eski / texnik | User-facing |
|---------------|-------------|
| Escrow | Himoyalangan to'lov |
| Ledger | Tranzaksiyalar tarixi |
| Sandbox / test | *(user UI da yo'q)* |
| Payment held | Mablag' ushlab turilmoqda |

## Navigatsiya

| Yo'l | Label |
|------|-------|
| `/services` | Xizmatlar |
| `/projects` | Loyiha bozori (header) |
| `/dashboard/wallet` | Pul va to'lovlar |
| `/dashboard/orders` | Buyurtmalar |

## Qochish kerak

- «Birja», «Exchange» — faqat ichki kod/i18n kalit nomlarida qolishi mumkin, UI matnida emas
- «#1 platforma», «0% komissiya» — isbotlanmaguncha
- «Tez orada», «Sandbox» — marketing va checkout da emas
