# Public sahifalar — asosiy va'da audit (1.1)

> **Va'da:** 24 soat ichida mutaxassis toping + himoyalangan to'lov (fixed-price marketplace).  
> **Sana:** 2026-06-10 · Product polish 1.1

| Sahifa | URL | Va'dani kuchaytiradimi? | Izoh |
|--------|-----|-------------------------|------|
| Bosh sahifa | `/` | ✅ | Hero qidiruv, `IshborProtectionStrip`, activity feed, top xizmatlar |
| Xizmatlar katalogi | `/services` | ✅ | Asosiy discovery — narx, muddat, reyting |
| Xizmat detali | `/services/[id]` | ✅ | Includes (freelancer), checkout 3 bosqich, himoya strip |
| Freelancerlar | `/freelancers` | ✅ | Supply vitrina — profilga yo'naltirish |
| Freelancer profil | `/freelancer/[id]` | ✅ | Portfolio, xizmatlar, ishonch signallari |
| Loyiha bozori | `/projects` | ⚠️ ikkilamchi | Subtitle: tayyor xizmat birinchi; loyiha ikkinchi |
| Loyiha detali | `/projects/[id]` | ⚠️ ikkilamchi | Birja modeli — navda kichik |
| Loyiha joylash | `/post-project` | ⚠️ ikkilamchi | `post_project_marketplace_hint` — maxsus loyiha |
| Kirish / Ro'yxat | `/login`, `/register` | ✅ | Marketplace home ga yo'naltirish |
| Yordam | `/help` | ✅ | Qanday ishlaydi, himoya |
| Mijoz himoyasi | `/buyer-protection` | ✅ | Escrow tushuntirish |
| Narxlar | `/pricing` | ✅ | Free tier professional; Pro yashirilgan |
| Blog | `/blog` | ✅ | Qo'llanma uslubi, roadmap emas |
| Terms / Privacy | `/terms`, `/privacy` | ✅ | Qonuniy — va'daga zid emas |
| Ish e'lonlari | `/jobs` | ⬜ uchinchi | Header navda yo'q; minimal landing |
| Kompaniyalar | `/companies` | ⬜ uchinchi | Header navda yo'q; minimal landing |
| CV yaratuvchi | `/cv-builder` | ⬜ uchinchi | Header navda yo'q |

## Xulosa

- **Asosiy oqim** (/, /services, /freelancer/*, /help, /buyer-protection) va'dani kuchaytiradi.
- **Ikkinchi oqim** (/projects, /post-project) aniq ikkilamchi label bilan ajratilgan.
- **Uchinchi yo'nalishlar** (jobs, companies, cv) marketing navdan yashirilgan — va'daga aralashmaydi.

**1.1 holati:** ✅ audit o'tdi (qo'lda tekshiruv + kod bazasi mosligi).
