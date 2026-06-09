'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/application/providers/app-provider'
import { useAuthReady } from '@/shared/lib/use-auth-ready'
import { api } from '@/infrastructure/api/client'
import type { ApiUserReputation } from '@/infrastructure/api/types'
import { LoadingBlock } from '@/presentation/components/ui/loading-block'
import { ReputationBadge } from '@/presentation/components/features/reputation-badge'
import { VerifiedBadge } from '@/presentation/components/features/verified-badge'

type BreakdownKey =
  | 'reviews_points'
  | 'completed_orders_points'
  | 'success_rate_points'
  | 'verification_points'
  | 'response_time_points'
  | 'dispute_penalty'

const ROWS: { key: BreakdownKey; labelKey: 'trust_pts_reviews' | 'trust_pts_orders' | 'trust_pts_success' | 'trust_pts_verify' | 'trust_pts_response' | 'trust_pts_dispute_penalty'; negative?: boolean }[] = [
  { key: 'reviews_points', labelKey: 'trust_pts_reviews' },
  { key: 'completed_orders_points', labelKey: 'trust_pts_orders' },
  { key: 'success_rate_points', labelKey: 'trust_pts_success' },
  { key: 'verification_points', labelKey: 'trust_pts_verify' },
  { key: 'response_time_points', labelKey: 'trust_pts_response' },
  { key: 'dispute_penalty', labelKey: 'trust_pts_dispute_penalty', negative: true },
]

export function TrustScoreBreakdown({ userId }: { userId?: string }) {
  const { t } = useApp()
  const { ready, authed } = useAuthReady()
  const [data, setData] = useState<ApiUserReputation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      setLoading(true)
      api
        .getTrustBreakdown(userId)
        .then(setData)
        .catch(() => setData(null))
        .finally(() => setLoading(false))
      return
    }
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
  }, [userId, ready, authed])

  if (loading) return <LoadingBlock className="py-6" />
  if (!data) return null

  const breakdown = data.trust_breakdown ?? {}

  return (
    <div className="surface-panel p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h3 className="text-[15px] font-bold text-[var(--ishbor-text)]">{t('trust_breakdown_title')}</h3>
        <ReputationBadge trustScore={data.trust_score} />
        {breakdown.is_verified ? <VerifiedBadge /> : null}
      </div>
      <ul className="space-y-2">
        {ROWS.map(({ key, labelKey, negative }) => {
          const val = Number(breakdown[key] ?? 0)
          if (!val && key !== 'verification_points') return null
          return (
            <li key={key} className="flex items-center justify-between text-[13px]">
              <span className="text-[var(--ishbor-text-muted)]">{t(labelKey)}</span>
              <span className={negative ? 'font-semibold text-[var(--error)]' : 'font-semibold text-[var(--ishbor-text)]'}>
                {negative ? `-${val}` : `+${val}`}
              </span>
            </li>
          )
        })}
      </ul>
      <p className="mt-4 text-[12px] text-[var(--ishbor-text-muted)]">
        {t('trust_pts_orders')}: {data.completed_orders} · {t('trust_pts_reviews')}: {data.review_count}
      </p>
    </div>
  )
}
