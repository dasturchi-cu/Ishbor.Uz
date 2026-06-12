import type { TranslationKey } from '@/infrastructure/i18n'

/** SSR-safe integer grouping (avoids Intl locale hydration mismatch). */
function formatSomInteger(amount: number): string {
  const sign = amount < 0 ? '-' : ''
  const digits = Math.abs(Math.round(amount)).toString()
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0')
  return `${sign}${grouped} so'm`
}

export function formatPrice(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1).replace(/\.0$/, '')} mlrd so'm`
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '')} mln so'm`
  }
  return formatSomInteger(amount)
}

const STATUS_LABEL_KEYS: Record<string, TranslationKey> = {
  pending: 'status_pending',
  active: 'status_in_progress',
  delivered: 'status_in_review',
  completed: 'completed',
  cancelled: 'cancel_order',
  disputed: 'disputed',
}

const STATUS_PROGRESS: Record<string, number> = {
  pending: 15,
  active: 45,
  delivered: 75,
  completed: 100,
  cancelled: 0,
  disputed: 50,
}

export function orderStatusLabel(
  status: string,
  t: (key: TranslationKey) => string
): string {
  const key = STATUS_LABEL_KEYS[status]
  return key ? t(key) : status
}

export function orderProgress(status: string): number {
  return STATUS_PROGRESS[status] ?? 0
}
