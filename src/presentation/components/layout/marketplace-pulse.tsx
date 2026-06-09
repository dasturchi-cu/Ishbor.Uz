'use client'

import { useEffect, useMemo, useState } from 'react'
import { Activity, Circle } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import type { ApiPublicStats } from '@/infrastructure/api/types'
import { cn } from '@/shared/lib/utils'

const PULSE_INTERVAL_MS = 5000

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
    const list: PulseItem[] = []

    const newestService = stats.top_services?.[0]
    if (newestService?.title) {
      list.push({
        id: 'new-service',
        text: t('landing_pulse_new_service').replace('{title}', newestService.title),
      })
    }

    if (stats.completed_orders != null && stats.completed_orders > 0) {
      list.push({
        id: 'completed',
        text: t('landing_pulse_completed_count').replace('{n}', String(stats.completed_orders)),
      })
    }

    if (stats.review_count > 0) {
      list.push({
        id: 'reviews',
        text: `${stats.review_count}+ ${t('landing_stat_reviews').toLowerCase()}`,
      })
    }

    if (stats.services > 0) {
      list.push({
        id: 'services',
        text: t('landing_pulse_services_count').replace('{n}', String(stats.services)),
      })
    }

    if (stats.freelancers > 0) {
      list.push({
        id: 'freelancers',
        text: t('landing_pulse_freelancers_count').replace('{n}', String(stats.freelancers)),
      })
    }

    for (const event of stats.recent_activity ?? []) {
      if (!event.title) continue
      if (event.kind === 'order_completed') {
        list.push({
          id: event.id,
          text: t('landing_pulse_order_done').replace('{title}', event.title),
        })
      } else if (event.kind === 'new_service') {
        list.push({
          id: event.id,
          text: t('landing_pulse_new_service').replace('{title}', event.title),
        })
      }
    }

    if (list.length === 0) {
      list.push({ id: 'growing', text: t('landing_pulse_growing') })
    }

    const seen = new Set<string>()
    return list.filter((item) => {
      if (seen.has(item.text)) return false
      seen.add(item.text)
      return true
    })
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
