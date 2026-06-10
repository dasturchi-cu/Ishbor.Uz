'use client'

import { useCallback, useEffect, useState } from 'react'
import { useApp } from '@/application/providers/app-provider'
import { AdminLayout } from '@/presentation/features/admin/admin-layout'
import { Card } from '@/presentation/components/ui/card'
import { Alert } from '@/presentation/components/ui/alert'
import { api } from '@/infrastructure/api/client'
import type { ApiAdminAnalytics } from '@/infrastructure/api/types'
import { formatPrice } from '@/shared/lib/format'
import dynamic from 'next/dynamic'
import { LoadingBlock } from '@/presentation/components/ui/loading-block'

const AdminCharts = dynamic(
  () => import('@/presentation/features/admin/admin-charts').then((m) => m.AdminCharts),
  { ssr: false, loading: () => <LoadingBlock /> }
)
import { useAuthReady } from '@/shared/lib/use-auth-ready'
import { captureLoadError } from '@/shared/lib/load-error'

export function AdminAnalyticsPage() {
  const { t } = useApp()
  const { authed, ready } = useAuthReady()
  const [analytics, setAnalytics] = useState<ApiAdminAnalytics | null>(null)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setAnalytics(await api.adminAnalytics(days))
    } catch (e) {
      setError(captureLoadError(e, { scope: 'admin' }, t))
    } finally {
      setLoading(false)
    }
  }, [days, t])

  useEffect(() => {
    if (!ready || !authed) return
    void load()
  }, [load, ready, authed])

  return (
    <AdminLayout onRefresh={() => void load()} refreshing={loading}>
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      <div className="mb-4 flex flex-wrap gap-2">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDays(d)}
            className={`rounded-lg px-3 py-1.5 text-[13px] font-medium ${
              days === d ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--admin-bg)] text-[var(--admin-muted)]'
            }`}
          >
            {d} {t('admin_days')}
          </button>
        ))}
      </div>

      {loading && !analytics ? (
        <LoadingBlock className="py-16" />
      ) : null}

      {analytics && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: t('admin_growth_users'), value: String(analytics.new_users) },
              { label: t('admin_growth_revenue'), value: formatPrice(analytics.revenue_completed) },
              {
                label: t('admin_growth_commission'),
                value: formatPrice(analytics.platform_revenue_completed ?? 0),
              },
              { label: t('admin_conversion'), value: `${analytics.conversion_rate}%` },
              { label: t('admin_search_events'), value: String(analytics.search_events ?? 0) },
              { label: t('admin_funnel_cta_clicks'), value: String(analytics.funnel_cta_clicks ?? 0) },
              { label: t('admin_funnel_register_views'), value: String(analytics.funnel_register_views ?? 0) },
              { label: t('admin_funnel_signup_rate'), value: `${analytics.funnel_signup_rate ?? 0}%` },
              { label: t('admin_activation_onboarding'), value: String(analytics.activation_onboarding ?? 0) },
              { label: t('admin_activation_employer'), value: String(analytics.activation_employer ?? 0) },
              { label: t('admin_activation_candidate'), value: String(analytics.activation_candidate ?? 0) },
            ].map((item) => (
              <Card key={item.label} className="admin-kpi-card p-4">
                <p className="text-[11px] uppercase text-[var(--admin-muted)]">{item.label}</p>
                <p className="mt-1 text-2xl font-bold">{item.value}</p>
              </Card>
            ))}
          </div>

          {(analytics.top_searches?.length ?? 0) > 0 && (
            <Card className="mb-6 p-5">
              <h2 className="mb-4 text-[13px] font-semibold uppercase text-[var(--admin-muted)]">
                {t('admin_top_searches')}
              </h2>
              <ul className="space-y-2">
                {analytics.top_searches!.map((row) => (
                  <li
                    key={`${row.surface}-${row.query}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--admin-border)] px-3 py-2 text-[13px]"
                  >
                    <span className="font-medium text-[var(--admin-text)]">{row.query}</span>
                    <span className="text-[var(--admin-muted)]">
                      {t(
                        row.surface === 'projects'
                          ? 'admin_search_surface_projects'
                          : row.surface === 'services'
                            ? 'admin_search_surface_services'
                            : 'admin_search_surface_other'
                      )}{' '}
                      · {row.count}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card className="p-5">
            <h2 className="mb-4 text-[13px] font-semibold uppercase text-[var(--admin-muted)]">{t('admin_analytics_section')}</h2>
            <AdminCharts
              analytics={analytics}
              usersLabel={t('admin_chart_users')}
              revenueLabel={t('admin_chart_revenue')}
              commissionLabel={t('admin_chart_commission')}
              emptyLabel={t('admin_chart_empty')}
            />
          </Card>
        </>
      )}
    </AdminLayout>
  )
}
