'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Shield } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { useAuthReady } from '@/shared/lib/use-auth-ready'
import { api } from '@/infrastructure/api/client'
import type { ApiUserReputation } from '@/infrastructure/api/types'
import { PATHS } from '@/domain/constants/routes'
import { ReputationBadge } from '@/presentation/components/features/reputation-badge'
import { VerifiedBadge } from '@/presentation/components/features/verified-badge'
import { Skeleton } from '@/presentation/components/ui/skeleton'

export function ProfileTrustScoreCard() {
  const { t } = useApp()
  const { ready, authed } = useAuthReady()
  const [data, setData] = useState<ApiUserReputation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ready || !authed) {
      setLoading(false)
      setData(null)
      return
    }
    setLoading(true)
    api
      .getMyTrustBreakdown()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [ready, authed])

  if (loading) {
    return (
      <div className="rounded-[var(--r-card)] border border-[var(--ishbor-border)] bg-[var(--neutral-0)] p-4 shadow-[var(--shadow-card)]">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-3 h-10 w-20" />
        <Skeleton className="mt-2 h-4 w-full max-w-xs" />
      </div>
    )
  }

  if (!data || data.trust_score == null) return null

  const breakdown = data.trust_breakdown ?? {}

  return (
    <div className="rounded-[var(--r-card)] border border-[var(--ishbor-border)] bg-[var(--neutral-0)] p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center gap-2">
        <Shield className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
        <h3 className="text-[14px] font-semibold text-[var(--ishbor-text)]">{t('reputation_trust_score')}</h3>
        <ReputationBadge trustScore={data.trust_score} />
        {breakdown.is_verified ? <VerifiedBadge /> : null}
      </div>
      <p className="mt-2 text-[24px] font-bold tabular-nums tracking-tight text-[var(--ishbor-text)]">
        {data.trust_score}
        <span className="ml-1 text-[14px] font-medium text-[var(--ishbor-text-muted)]">/ 100</span>
      </p>
      <p className="mt-1 text-[12px] leading-relaxed text-[var(--ishbor-text-muted)]">{t('profile_trust_score_hint')}</p>
      <p className="mt-2 text-[12px] text-[var(--ishbor-text-sub)]">
        {t('trust_pts_orders')}: {data.completed_orders} · {t('trust_pts_reviews')}: {data.review_count}
      </p>
      <Link href={PATHS.dashboardAnalytics} className="profile-view-link mt-3 inline-flex">
        {t('profile_trust_view_details')}
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}
