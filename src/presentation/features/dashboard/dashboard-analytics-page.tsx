'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'

const AnalyticsCharts = dynamic(
  () => import('./analytics-charts').then((m) => m.AnalyticsCharts),
  {
    ssr: false,
    loading: () => <div className="mt-5 h-64 animate-pulse rounded-xl bg-[var(--color-bg-muted)]" />,
  }
)
import { useApp } from '@/application/providers/app-provider'
import { StatCard } from '@/presentation/components/ui/stat-card'
import { api } from '@/infrastructure/api/client'
import type { ApiAnalytics } from '@/infrastructure/api/types'
import { formatPrice } from '@/shared/lib/format'
import { DollarSign, ShoppingBag, Eye } from 'lucide-react'
import { Button } from '@/presentation/components/ui/button'
import { cn } from '@/shared/lib/utils'
import { Alert } from '@/presentation/components/ui/alert'
import { useDashboardRole } from '@/presentation/components/auth/role-guard'
import { useAuthedEffect } from '@/shared/lib/use-auth-ready'
import { TrustScoreBreakdown } from '@/presentation/components/features/trust-score-breakdown'

const PERIODS = ['7d', '30d', '3m', '1y'] as const

export function DashboardAnalyticsPage() {
  const { t } = useApp()
  const isClient = useDashboardRole() === 'client'
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>('30d')
  const [data, setData] = useState<ApiAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const requestSeqRef = useRef(0)
  const loadAnalyticsRef = useRef<(attempt?: number) => Promise<void>>(async () => {})

  const loadAnalytics = useCallback(async (attempt = 0) => {
    const seq = ++requestSeqRef.current
    if (attempt === 0) {
      setLoading(true)
      setLoadError(false)
    }

    try {
      const result = await api.getAnalytics(period)
      if (seq !== requestSeqRef.current) return
      setData(result)
      setLoadError(false)
    } catch {
      if (seq !== requestSeqRef.current) return
      if (attempt < 1) {
        window.setTimeout(() => {
          void loadAnalyticsRef.current(attempt + 1)
        }, 1200)
        return
      }
      setData(null)
      setLoadError(true)
    } finally {
      if (seq === requestSeqRef.current) {
        setLoading(false)
      }
    }
  }, [period])

  useEffect(() => {
    loadAnalyticsRef.current = loadAnalytics
  }, [loadAnalytics])

  useAuthedEffect(() => {
    void loadAnalytics()
  }, [loadAnalytics])

  const periodLabel = {
    '7d': t('analytics_period_7d'),
    '30d': t('analytics_period_30d'),
    '3m': t('analytics_period_3m'),
    '1y': t('analytics_period_1y'),
  }

  if (loading && !data) {
    return <div className="h-64 animate-pulse rounded-xl bg-[var(--color-bg-muted)]" />
  }

  const chartData = data?.chart_data ?? []
  const pieData = data?.pie_data ?? []
  const regions = data?.regions ?? []

  return (
    <div>
      <div className="mb-5 flex justify-end gap-2">
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={cn(
              'rounded-full px-3 py-1.5 text-[12px] font-medium',
              period === p
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--neutral-0)] text-[var(--kwork-text-muted)] border border-[var(--kwork-border)]'
            )}
          >
            {periodLabel[p]}
          </button>
        ))}
      </div>

      {loadError && (
        <Alert variant="error" className="mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{t('data_load_failed')}</span>
            <Button variant="outline" size="sm" onClick={() => void loadAnalytics()}>
              {t('catalog_retry')}
            </Button>
          </div>
        </Alert>
      )}

      {(data?.order_count ?? 0) === 0 && !loadError && (
        <Alert variant="info" className="mb-4 text-[13px]">
          {t('analytics_empty_note')}
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={DollarSign}
          label={isClient ? t('client_analytics_spent_label') : t('stat_revenue')}
          value={formatPrice(data?.completed_revenue ?? 0)}
        />
        <StatCard
          icon={ShoppingBag}
          label={t('stat_orders_analytics')}
          value={String(data?.order_count ?? 0)}
        />
        <StatCard icon={Eye} label={t('stat_profile_views')} value={String(data?.profile_views ?? 0)} />
        <StatCard icon={Eye} label={t('stat_service_views')} value={String(data?.service_views ?? 0)} />
      </div>

      <AnalyticsCharts
        chartData={chartData}
        pieData={pieData}
        regions={regions}
        emptyLabel={t('no_orders_yet')}
        revenueTitle={t('revenue_chart_title')}
        statusTitle={t('orders_by_status')}
        geoTitle={t('buyer_geography')}
      />

      {!isClient && (
        <div className="mt-6">
          <TrustScoreBreakdown />
        </div>
      )}
    </div>
  )
}
