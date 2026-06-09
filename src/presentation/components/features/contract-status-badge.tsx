'use client'

import { useApp } from '@/application/providers/app-provider'
import { CONTRACT_STATUS_KEYS, marketplaceStatusLabel } from '@/shared/lib/marketplace-status'
import { cn } from '@/shared/lib/utils'

const STATUS_CLASS: Record<string, string> = {
  pending_payment: 'bg-[var(--warning-bg)] text-[var(--warning-dark)]',
  active: 'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
  submitted: 'bg-[var(--warning-bg)] text-[var(--warning-dark)]',
  revision_requested: 'bg-[var(--warning-bg)] text-[var(--warning-dark)]',
  completed: 'bg-[var(--success-bg)] text-[var(--success-dark)]',
  cancelled: 'bg-[var(--neutral-100)] text-[var(--ishbor-text-muted)]',
  disputed: 'bg-[var(--danger-bg)] text-[var(--danger-dark)]',
}

export function ContractStatusBadge({ status }: { status?: string | null }) {
  const { t } = useApp()
  const normalized = status ?? 'active'

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
        STATUS_CLASS[normalized] ?? STATUS_CLASS.active,
      )}
    >
      {marketplaceStatusLabel(CONTRACT_STATUS_KEYS, normalized, t)}
    </span>
  )
}
