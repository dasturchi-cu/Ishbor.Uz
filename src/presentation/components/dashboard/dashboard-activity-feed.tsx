'use client'

import Link from 'next/link'
import { CreditCard, MessageCircle, Package, ShoppingBag } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { cn } from '@/shared/lib/utils'
import { Skeleton } from '@/presentation/components/ui/skeleton'
import { formatRelativeTime } from '@/shared/lib/format-relative-time'
import { useMergedActivityFeed, type FeedKind } from '@/shared/lib/use-merged-activity-feed'

const KIND_ICON: Record<FeedKind, LucideIcon> = {
  activity: Package,
  order: ShoppingBag,
  message: MessageCircle,
  payment: CreditCard,
}

const KIND_CLASS: Record<FeedKind, string> = {
  activity: 'activity-timeline-icon',
  order: 'activity-timeline-icon activity-timeline-icon--order',
  message: 'activity-timeline-icon activity-timeline-icon--message',
  payment: 'activity-timeline-icon activity-timeline-icon--payment',
}

export function DashboardActivityFeed({ className, limit = 10 }: { className?: string; limit?: number }) {
  const { t, language } = useApp()
  const { items, loading } = useMergedActivityFeed(t, limit)

  if (loading) {
    return (
      <ul className={cn('activity-timeline', className)} role="status" aria-live="polite">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="activity-timeline-item">
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-full max-w-[220px]" />
            </div>
          </li>
        ))}
      </ul>
    )
  }

  if (items.length === 0) {
    return (
      <p className={cn('py-4 text-center text-[13px] text-[var(--kwork-text-muted)]', className)}>
        {t('activity_empty')}
      </p>
    )
  }

  return (
    <ul className={cn('activity-timeline', className)}>
      {items.map((item, i) => {
        const Icon = KIND_ICON[item.kind]
        const inner = (
          <>
            <span className={KIND_CLASS[item.kind]}>
              <Icon className="h-4 w-4" />
            </span>
            <div className="activity-timeline-body">
              <p className="activity-timeline-text font-medium">{item.title}</p>
              {item.body && (
                <p className="text-[12px] text-[var(--kwork-text-muted)] line-clamp-2">{item.body}</p>
              )}
              <time className="activity-timeline-time">
                {formatRelativeTime(item.created_at, language)}
              </time>
            </div>
            {i < items.length - 1 && <span className="activity-timeline-line" aria-hidden />}
          </>
        )
        return (
          <li key={item.id} className="activity-timeline-item">
            {item.href ? (
              <Link href={item.href} className="flex gap-3 no-underline text-inherit hover:opacity-90">
                {inner}
              </Link>
            ) : (
              inner
            )}
          </li>
        )
      })}
    </ul>
  )
}
