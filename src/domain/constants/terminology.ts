/**
 * User-facing terminologiya — bitta lug'at (product polish 3.4).
 * UI matnlari shu atamalarga mos bo'lishi kerak.
 */
export const USER_TERMINOLOGY = {
  /** Asosiy mahsulot: tayyor xizmat sotib olish */
  marketplace: 'marketplace',
  service: 'service',
  order: 'order',
  /** Ikkinchi daraja: mijoz loyihasi, freelancer ariza beradi */
  projectMarketplace: 'project_marketplace',
  project: 'project',
  application: 'application',
  /** Buyurtma ichidagi himoyalangan to'lov — alohida nav emas */
  protectedPayment: 'protected_payment',
  /** Shartnoma — faqat loyiha/birja kontekstida */
  contract: 'contract',
} as const

/** i18n kalitlari — useApp().t() orqali */
export const TERM_I18N = {
  marketplaceHome: 'nav_services' as const,
  order: 'nav_orders' as const,
  projectMarketplace: 'nav_project_marketplace' as const,
  protectedPayment: 'protected_payment_label' as const,
  contract: 'contracts' as const,
  dispute: 'disputed' as const,
} as const
