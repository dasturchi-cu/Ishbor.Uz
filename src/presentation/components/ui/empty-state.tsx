'use client'

import * as React from 'react'
import { Button } from '@/presentation/components/ui/button'

export interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description?: string
  action?: { label: string; onClick: () => void; variant?: 'primary' | 'outline' }
  secondaryAction?: { label: string; onClick: () => void; variant?: 'primary' | 'outline' }
  compact?: boolean
}

export function EmptyState({ icon, title, description, action, secondaryAction, compact }: EmptyStateProps) {
  if (compact) {
    return (
      <div className="dashboard-empty-inline rounded-[var(--r-card)] border border-[var(--ishbor-border)] bg-[var(--neutral-0)] px-4 py-3 shadow-[var(--shadow-xs)]">
        <div className="dashboard-empty-inline-icon text-[var(--ishbor-text-muted)] [&>svg]:h-8 [&>svg]:w-8">{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-[var(--ishbor-text)]">{title}</p>
          {description && (
            <p className="mt-0.5 text-[13px] leading-snug text-[var(--ishbor-text-muted)]">{description}</p>
          )}
        </div>
        {action && (
          <Button variant={action.variant ?? 'outline'} size="sm" onClick={action.onClick} className="shrink-0">
            {action.label}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="empty-state flex flex-col items-center gap-4 px-6 py-10 text-center">
      <div className="empty-state__illustration" aria-hidden>
        <span className="empty-state__ring empty-state__ring--outer" />
        <span className="empty-state__ring empty-state__ring--inner" />
        <div className="empty-state__icon text-[var(--color-primary)] [&>svg]:h-10 [&>svg]:w-10">
          {icon}
        </div>
      </div>
      <h3 className="text-[var(--text-h4)] font-bold text-[var(--ishbor-text)]">{title}</h3>
      {description && (
        <p className="max-w-[320px] text-[14px] leading-relaxed text-[var(--ishbor-text-muted)]">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {action && (
            <Button variant={action.variant ?? 'primary'} size="md" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant={secondaryAction.variant ?? 'outline'} size="md" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
