'use client'

import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

export type StatCardIconTone = 'primary' | 'success' | 'warning' | 'purple'

const ICON_TONE_CLASS: Record<StatCardIconTone, string> = {
  primary: 'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
  success: 'bg-[var(--success-bg)] text-[var(--success)]',
  warning: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
  purple: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
}

export interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string
  change?: string
  changePositive?: boolean
  changeNeutral?: boolean
  iconTone?: StatCardIconTone
  loading?: boolean
  className?: string
}

export function StatCard({
  icon: Icon,
  label,
  value,
  change,
  changePositive = true,
  changeNeutral = false,
  iconTone = 'primary',
  loading,
  className,
}: StatCardProps) {
  return (
    <div className={cn('dashboard-stat-card', className)}>
      <div className={cn('dashboard-stat-icon', ICON_TONE_CLASS[iconTone])}>
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        {loading ? (
          <div className="space-y-2">
            <div className="h-7 w-16 animate-pulse rounded-md bg-[var(--color-bg-muted)]" />
            <div className="h-3.5 w-24 animate-pulse rounded bg-[var(--color-bg-muted)]" />
          </div>
        ) : (
          <>
            <p className="dashboard-stat-value">{value}</p>
            <p className="dashboard-stat-label">{label}</p>
            {change && (
              <p
                className={cn(
                  'mt-1 text-[11px] font-semibold',
                  changeNeutral
                    ? 'text-[var(--kwork-text-muted)]'
                    : changePositive
                      ? 'text-[var(--success)]'
                      : 'text-[var(--error)]'
                )}
              >
                {change}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
