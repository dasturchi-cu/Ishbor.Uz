'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'

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
import type { ApiOrder } from '@/infrastructure/api/types'
import {
  buyerRegions,
  ordersByStatus,
  ordersInPeriod,
  revenueByMonth,
} from '@/shared/lib/order-analytics'
import { formatPrice } from '@/shared/lib/format'
import { DollarSign, ShoppingBag, Eye } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

const PERIODS = { '7d': 7, '30d': 30, '3m': 90, '1y': 365 } as const

export function DashboardAnalyticsPage() {
  const { t } = useApp()
  const [period, setPeriod] = useState<keyof typeof PERIODS>('30d')
  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [profileViews, setProfileViews] = useState(0)
  const [serviceViews, setServiceViews] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.listOrders().catch(() => []),
      api.listMyServices().catch(() => []),
      api.getProfile().catch(() => null),
    ])
      .then(([ord, svc, profile]) => {
        setOrders(ord)
        setProfileViews(profile?.profile_views ?? 0)
        setServiceViews(svc.reduce((sum, s) => sum + (s.view_count ?? 0), 0))
      })
      .finally(() => setLoading(false))
  }, [])

  const periodOrders = useMemo(() => ordersInPeriod(orders, PERIODS[period]), [orders, period])
  const completedRevenue = useMemo(
    () => periodOrders.filter((o) => o.status === 'completed').reduce((sum, o) => sum + o.amount, 0),
    [periodOrders]
  )
  const chartData = useMemo(() => revenueByMonth(periodOrders, period === '7d' ? 4 : 6), [periodOrders, period])
  const pieData = useMemo(() => ordersByStatus(periodOrders), [periodOrders])
  const regions = useMemo(() => buyerRegions(periodOrders), [periodOrders])

  const periodLabel = {
    '7d': t('analytics_period_7d'),
    '30d': t('analytics_period_30d'),
    '3m': t('analytics_period_3m'),
    '1y': t('analytics_period_1y'),
  }

  if (loading) {
    return <div className="h-64 animate-pulse rounded-xl bg-[var(--color-bg-muted)]" />
  }

  return (
    <div>
      <div className="mb-5 flex justify-end gap-2">
        {(Object.keys(PERIODS) as Array<keyof typeof PERIODS>).map((p) => (
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={DollarSign} label={t('stat_revenue')} value={formatPrice(completedRevenue)} />
        <StatCard icon={ShoppingBag} label={t('stat_orders_analytics')} value={String(periodOrders.length)} />
        <StatCard icon={Eye} label={t('stat_profile_views')} value={String(profileViews)} />
        <StatCard icon={Eye} label={t('stat_service_views')} value={String(serviceViews)} />
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
    </div>
  )
}
