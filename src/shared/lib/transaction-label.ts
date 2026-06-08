import type { TranslationKey } from '@/infrastructure/i18n'

const TX_TYPE_KEYS: Record<string, TranslationKey> = {
  escrow_hold: 'tx_type_escrow_hold',
  escrow_release: 'tx_type_escrow_release',
  escrow_refund: 'tx_type_escrow_refund',
  withdrawal: 'tx_type_withdrawal',
  platform_commission: 'tx_type_platform_commission',
}

export function transactionTypeLabel(
  type: string,
  t: (key: TranslationKey) => string
): string {
  const key = TX_TYPE_KEYS[type]
  return key ? t(key) : type
}
