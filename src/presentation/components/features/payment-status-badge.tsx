'use client'

import { useApp } from '@/application/providers/app-provider'
import type { TranslationKey } from '@/infrastructure/i18n'
import { cn } from '@/shared/lib/utils'

const STATUS_KEYS: Record<string, TranslationKey> = {
  unpaid: 'payment_status_unpaid',
  held: 'payment_status_held',
  released: 'payment_status_released',
  refunded: 'payment_status_refunded',
}

const STATUS_CLASS: Record<string, string> = {
  unpaid: 'bg-[var(--warning-bg)] text-[var(--warning-dark)]',
  held: 'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
  released: 'bg-[var(--success-bg)] text-[var(--success-dark)]',
  refunded: 'bg-[var(--neutral-100)] text-[var(--kwork-text-muted)]',
}

export function PaymentStatusBadge({ status }: { status?: string | null }) {
  const { t } = useApp()
  const key = STATUS_KEYS[status ?? 'unpaid'] ?? 'payment_status_unpaid'

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        STATUS_CLASS[status ?? 'unpaid'] ?? STATUS_CLASS.unpaid,
      )}
    >
      {t(key)}
    </span>
  )
}
