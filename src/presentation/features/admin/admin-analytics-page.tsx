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
import type { TranslationKey } from '@/infrastructure/i18n'

const FUNNEL_STAGE_KEYS: Record<string, TranslationKey> = {
  register_views: 'admin_funnel_stage_register_views',
  registrations: 'admin_funnel_stage_registrations',
  logins: 'admin_funnel_stage_logins',
  profile_completion: 'admin_funnel_stage_profile_completion',
  discovery_views: 'admin_funnel_stage_discovery_views',
  checkout_started: 'admin_funnel_stage_checkout_started',
  payment_attempts: 'admin_funnel_stage_payment_attempts',
  payment_succeeded: 'admin_funnel_stage_payment_succeeded',
  messages_started: 'admin_funnel_stage_messages_started',
}

const FUNNEL_SUMMARY_KEYS: Record<string, TranslationKey> = {
  signup_rate: 'admin_funnel_summary_signup_rate',
  onboarding_rate: 'admin_funnel_summary_onboarding_rate',
  checkout_rate: 'admin_funnel_summary_checkout_rate',
  payment_conversion: 'admin_funnel_summary_payment_conversion',
}

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
              { label: t('admin_analytics_logins'), value: String(analytics.login_events ?? 0) },
              { label: t('admin_analytics_service_views'), value: String(analytics.service_views ?? 0) },
              { label: t('admin_analytics_freelancer_views'), value: String(analytics.freelancer_views ?? 0) },
              { label: t('admin_analytics_project_views'), value: String(analytics.project_views ?? 0) },
              { label: t('admin_analytics_checkout_started'), value: String(analytics.checkout_started_events ?? 0) },
              { label: t('admin_analytics_payment_attempts'), value: String(analytics.payment_attempt_events ?? 0) },
              { label: t('admin_analytics_payment_succeeded'), value: String(analytics.payment_succeeded_events ?? 0) },
              { label: t('admin_analytics_messages_started'), value: String(analytics.message_started_events ?? 0) },
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

          {(analytics.funnel_report?.stages?.length ?? 0) > 0 && (
            <Card className="mb-6 p-5">
              <h2 className="mb-4 text-[13px] font-semibold uppercase text-[var(--admin-muted)]">
                {t('admin_funnel_report_title')}
              </h2>
              <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {Object.entries(analytics.funnel_report!.summary).map(([key, value]) => {
                  const labelKey = FUNNEL_SUMMARY_KEYS[key]
                  if (!labelKey) return null
                  return (
                    <div
                      key={key}
                      className="rounded-lg border border-[var(--admin-border)] px-3 py-2"
                    >
                      <p className="text-[11px] uppercase text-[var(--admin-muted)]">{t(labelKey)}</p>
                      <p className="mt-1 text-xl font-bold">{value}%</p>
                    </div>
                  )
                })}
              </div>
              <ul className="space-y-2">
                {analytics.funnel_report!.stages.map((stage) => (
                  <li
                    key={stage.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--admin-border)] px-3 py-2 text-[13px]"
                  >
                    <span className="font-medium text-[var(--admin-text)]">
                      {t(FUNNEL_STAGE_KEYS[stage.id] ?? 'admin_analytics_section')}
                    </span>
                    <span className="text-[var(--admin-muted)]">
                      {stage.count}
                      {stage.rate_from_previous != null
                        ? ` · ${stage.rate_from_previous}% ${t('admin_funnel_from_previous')}`
                        : ''}
                      {stage.breakdown
                        ? ` · ${Object.entries(stage.breakdown)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(', ')}`
                        : ''}
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
