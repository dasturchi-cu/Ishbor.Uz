import type { TranslationKey } from '@/infrastructure/i18n'

const WITHDRAWAL_STATUS_KEYS: Record<string, TranslationKey> = {
  pending: 'withdrawal_status_pending',
  approved: 'withdrawal_status_approved',
  rejected: 'withdrawal_status_rejected',
}

export function withdrawalStatusLabel(
  status: string,
  t: (key: TranslationKey) => string
): string {
  const key = WITHDRAWAL_STATUS_KEYS[status]
  return key ? t(key) : status
}
