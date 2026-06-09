'use client'

import { useEffect, useMemo, useState } from 'react'
import { Activity, Circle } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import type { ApiPublicStats } from '@/infrastructure/api/types'
import { cn } from '@/shared/lib/utils'

const PULSE_INTERVAL_MS = 5000
const TIME_LABELS = ['1', '3', '5', '8', '12'] as const

function estimateOnline(freelancers: number): number {
  if (freelancers <= 0) return 12
  return Math.max(8, Math.min(99, Math.round(freelancers * 0.08 + 5)))
}

type PulseItem = { id: string; text: string }

export function MarketplacePulse({
  stats,
  className,
}: {
  stats: ApiPublicStats
  className?: string
}) {
  const { t } = useApp()
  const [activeIdx, setActiveIdx] = useState(0)

  const items = useMemo((): PulseItem[] => {
    const online = estimateOnline(stats.freelancers)
    const list: PulseItem[] = [
      {
        id: 'online',
        text: t('landing_users_online').replace('{n}', String(online)),
      },
    ]

    const topCategory = Object.entries(stats.category_counts ?? {})
      .sort(([, a], [, b]) => b - a)
      .map(([cat]) => cat)[0]

    if (topCategory) {
      list.push({
        id: 'completed',
        text: t('landing_pulse_completed').replace('{category}', topCategory),
      })
    }

    TIME_LABELS.forEach((time, i) => {
      list.push({
        id: `order-${i}`,
        text: t('landing_last_order').replace(
          '{time}',
          t('landing_time_minutes').replace('{n}', time)
        ),
      })
    })

    if (stats.review_count > 0) {
      list.push({
        id: 'reviews',
        text: `${stats.review_count}+ ${t('landing_stat_reviews').toLowerCase()}`,
      })
    }

    return list
  }, [stats, t])

  useEffect(() => {
    if (items.length <= 1) return
    const timer = setInterval(() => {
      setActiveIdx((i) => (i + 1) % items.length)
    }, PULSE_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [items.length])

  const current = items[activeIdx] ?? items[0]
  if (!current) return null

  return (
    <div className={cn('marketplace-pulse', className)} role="status" aria-live="polite">
      <span className="marketplace-pulse__label">
        <Activity className="h-3.5 w-3.5" aria-hidden />
        {t('landing_pulse_title')}
      </span>
      <span className="marketplace-pulse__dot" aria-hidden>
        <Circle className="h-2 w-2 fill-[var(--success)] text-[var(--success)]" />
      </span>
      <span key={current.id} className="marketplace-pulse__text animate-fadeInUp">
        {current.text}
      </span>
    </div>
  )
}
