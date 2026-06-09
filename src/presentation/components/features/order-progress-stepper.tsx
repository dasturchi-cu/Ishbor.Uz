'use client'

import { useApp } from '@/application/providers/app-provider'
import { cn } from '@/shared/lib/utils'
import type { TranslationKey } from '@/infrastructure/i18n'

const STEPS: { status: string; labelKey: TranslationKey }[] = [
  { status: 'pending', labelKey: 'order_status_pending' },
  { status: 'active', labelKey: 'order_status_active' },
  { status: 'delivered', labelKey: 'order_status_delivered' },
  { status: 'completed', labelKey: 'order_status_completed' },
]

function stepIndex(status: string): number {
  if (status === 'cancelled' || status === 'disputed') return -1
  return STEPS.findIndex((s) => s.status === status)
}

export function OrderProgressStepper({
  status,
  paymentStatus,
}: {
  status: string
  paymentStatus?: string | null
}) {
  const { t } = useApp()
  const current = stepIndex(status)
  const awaitingPayment = status === 'pending' && paymentStatus !== 'held'

  if (status === 'cancelled') {
    return (
      <p className="rounded-lg bg-[var(--error-bg)] px-3 py-2 text-[13px] font-medium text-[var(--error-dark)]">
        {t('order_status_cancelled')}
      </p>
    )
  }

  if (status === 'disputed') {
    return (
      <p className="rounded-lg bg-[var(--warning-bg)] px-3 py-2 text-[13px] font-medium text-[var(--warning-text)]">
        {t('disputed')}
      </p>
    )
  }

  return (
    <div className="ishbor-order-progress">
    <ol className="ishbor-order-progress__steps flex flex-wrap items-center gap-2 sm:gap-0">
      {STEPS.map((step, i) => {
        const done = current > i
        const active = current === i
        const labelKey =
          i === 0 && awaitingPayment ? ('order_status_awaiting_payment' as TranslationKey) : step.labelKey
        return (
          <li key={step.status} className="flex items-center">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold',
                  done && 'bg-[var(--color-primary)] text-white',
                  active && awaitingPayment && 'border-2 border-[var(--warning)] bg-[var(--warning-bg)] text-[var(--warning-dark)]',
                  active && !awaitingPayment && 'border-2 border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]',
                  !done && !active && 'bg-[var(--color-bg-muted)] text-[var(--ishbor-text-muted)]',
                )}
              >
                {i + 1}
              </span>
              <span
                className={cn(
                  'text-[12px] font-medium sm:text-[13px]',
                  (done || active) ? 'text-[var(--ishbor-text)]' : 'text-[var(--ishbor-text-muted)]',
                  active && awaitingPayment && 'text-[var(--warning-dark)]',
                )}
              >
                {t(labelKey)}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span
                className={cn(
                  'mx-2 hidden h-px w-6 sm:block md:w-10',
                  done ? 'bg-[var(--color-primary)]' : 'bg-[var(--ishbor-border)]',
                )}
                aria-hidden
              />
            )}
          </li>
        )
      })}
    </ol>
    </div>
  )
}
