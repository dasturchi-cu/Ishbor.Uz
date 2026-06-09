'use client'

import { useApp } from '@/application/providers/app-provider'
import { MILESTONE_STATUS_KEYS, marketplaceStatusLabel } from '@/shared/lib/marketplace-status'
import { cn } from '@/shared/lib/utils'

const STATUS_CLASS: Record<string, string> = {
  pending: 'bg-[var(--neutral-100)] text-[var(--kwork-text-muted)]',
  funded: 'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
  submitted: 'bg-[var(--warning-bg)] text-[var(--warning-dark)]',
  approved: 'bg-[var(--success-bg)] text-[var(--success-dark)]',
  released: 'bg-[var(--success-bg)] text-[var(--success-dark)]',
  cancelled: 'bg-[var(--neutral-100)] text-[var(--kwork-text-muted)]',
}

export function MilestoneStatusBadge({ status }: { status?: string | null }) {
  const { t } = useApp()
  const normalized = status ?? 'pending'

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
        STATUS_CLASS[normalized] ?? STATUS_CLASS.pending,
      )}
    >
      {marketplaceStatusLabel(MILESTONE_STATUS_KEYS, normalized, t)}
    </span>
  )
}
