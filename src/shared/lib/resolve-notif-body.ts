import type { TranslationKey } from '@/infrastructure/i18n'

const NOTIF_I18N_KEYS = new Set<string>([
  'notif_order_pending',
  'notif_order_delivered',
  'notif_order_completed',
  'notif_new_message',
])

export function resolveNotifText(
  text: string,
  t: (key: TranslationKey) => string
): string {
  if (NOTIF_I18N_KEYS.has(text)) {
    return t(text as TranslationKey)
  }
  return text
}
