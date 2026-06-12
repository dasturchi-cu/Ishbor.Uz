'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CheckCircle2, Shield, Star, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { PATHS } from '@/domain/constants/routes'
import { formatCompactStat } from '@/shared/lib/format-stat'
import { usePublicStats } from '@/shared/lib/use-public-stats'
import { cn } from '@/shared/lib/utils'

type MetricItem = { id: string; icon: LucideIcon; label: string }

export function MarketplaceTrustMetrics({
  className,
  compact,
}: {
  className?: string
  compact?: boolean
}) {
  const { t } = useApp()
  const stats = usePublicStats()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const metrics: MetricItem[] = []

  if (stats?.completed_orders != null && stats.completed_orders > 0) {
    metrics.push({
      id: 'orders',
      icon: CheckCircle2,
      label: t('marketplace_trust_orders').replace('{n}', formatCompactStat(stats.completed_orders)),
    })
  }
  if (stats && stats.avg_rating > 0) {
    metrics.push({
      id: 'rating',
      icon: Star,
      label: t('marketplace_trust_rating').replace('{rating}', stats.avg_rating.toFixed(1)),
    })
  }
  if (stats && stats.review_count > 0) {
    metrics.push({
      id: 'reviews',
      icon: Star,
      label: t('marketplace_trust_reviews').replace('{n}', formatCompactStat(stats.review_count)),
    })
  }
  if (stats && stats.freelancers > 0) {
    metrics.push({
      id: 'freelancers',
      icon: Users,
      label: t('marketplace_trust_freelancers').replace('{n}', formatCompactStat(stats.freelancers)),
    })
  }

  return (
    <div
      className={cn(
        'marketplace-trust-metrics',
        compact && 'marketplace-trust-metrics--compact',
        className
      )}
      role="region"
      aria-label={t('marketplace_trust_region')}
    >
      <span className="marketplace-trust-metrics__escrow">
        <Shield className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {t('card_escrow_protected')}
      </span>
      {mounted && metrics.length > 0 ? (
        <ul className="marketplace-trust-metrics__list" aria-label={t('marketplace_trust_stats')}>
          {metrics.map(({ id, icon: Icon, label }) => (
            <li key={id} className="marketplace-trust-metrics__item">
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>{label}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <Link href={PATHS.buyerProtection} className="marketplace-trust-metrics__link">
        {t('marketplace_trust_learn_more')} →
      </Link>
    </div>
  )
}
