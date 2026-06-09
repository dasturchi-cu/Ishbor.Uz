---
name: ishbor-ui-review
description: IshBor.uz UI/UX tekshiruvi — i18n, responsive, accessibility, dizayn tizimi. Use when reviewing pages, fixing UI bugs, or checking design consistency.
---

# IshBor UI Review Skill

## O'qish tartibi
1. [design/figma-tokens.json](../../design/figma-tokens.json)
2. [design/components-spec.md](../../design/components-spec.md)
3. `.cursor/rules/react-ui.mdc`

## Tekshirish ro'yxati

### Til
- [ ] Barcha matn `t()` orqali
- [ ] Default o'zbekcha
- [ ] Narxlar so'mda

### Dizayn
- [ ] Primary: `#2563EB` (Kwork blue)
- [ ] Accent: `#F59E0B` (amber)
- [ ] `.select-auth` purple formlarda
- [ ] Ikki footer yo'q

### Responsive
- [ ] Mobile navbar menu
- [ ] Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
- [ ] Jadval: `overflow-x-auto`

### UX
- [ ] Loading state
- [ ] Empty state ("Xizmat topilmadi")
- [ ] Form xato xabarlari i18n da
- [ ] Tugmalar disabled holati

### Sahifalar (11 ta)
landing, register, login, freelancer-dashboard, client-dashboard, services, freelancer-profile, post-project, messages, wallet, settings

## Ma'lum muammolar
- `href="#"` — keyinroq real route
- Mock auth — backend kelguncha OK
- Eski `*.tsx` (premium emas) — o'chirish kerak
