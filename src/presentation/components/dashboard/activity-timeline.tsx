'use client'

import { useEffect, useState } from 'react'
import { MessageCircle, Package, ShoppingBag, Star } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { api } from '@/infrastructure/api/client'
import type { ApiNotification } from '@/infrastructure/api/types'
import { cn } from '@/shared/lib/utils'
import { Skeleton } from '@/presentation/components/ui/skeleton'
import { formatRelativeTime } from '@/shared/lib/format-relative-time'
import { resolveNotifText } from '@/shared/lib/resolve-notif-body'

const TYPE_ICON: Record<ApiNotification['type'], LucideIcon> = {
  order: ShoppingBag,
  message: MessageCircle,
  review: Star,
}

export function ActivityTimeline({ className }: { className?: string }) {
  const { t, language } = useApp()
  const [items, setItems] = useState<ApiNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .listNotifications()
      .then((data) => setItems(data.slice(0, 5)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <ul className={cn('activity-timeline', className)} role="status" aria-live="polite">
        {Array.from({ length: 3 }).map((_, i) => (
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
        {t('notifications_empty')}
      </p>
    )
  }

  return (
    <ul className={cn('activity-timeline', className)}>
      {items.map((item, i) => {
        const Icon = TYPE_ICON[item.type] ?? Package
        return (
          <li key={item.id} className="activity-timeline-item">
            <span className="activity-timeline-icon">
              <Icon className="h-4 w-4" />
            </span>
            <div className="activity-timeline-body">
              <p className="activity-timeline-text font-medium">{resolveNotifText(item.title, t)}</p>
              <p className="text-[12px] text-[var(--kwork-text-muted)]">{resolveNotifText(item.body, t)}</p>
              <time className="activity-timeline-time">{formatRelativeTime(item.created_at, language)}</time>
            </div>
            {i < items.length - 1 && <span className="activity-timeline-line" aria-hidden />}
          </li>
        )
      })}
    </ul>
  )
}
