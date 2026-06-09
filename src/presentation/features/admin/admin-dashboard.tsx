'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users,
  UserPlus,
  Briefcase,
  Building2,
  Wallet,
  Scale,
  Landmark,
  TrendingUp,
  Activity,
  ArrowRight,
} from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { Card } from '@/presentation/components/ui/card'
import { Alert } from '@/presentation/components/ui/alert'
import { Button } from '@/presentation/components/ui/button'
import { LoadingBlock } from '@/presentation/components/ui/loading-block'
import { api } from '@/infrastructure/api/client'
import type { ApiAdminAnalytics, ApiAdminStats, ApiAuditLog } from '@/infrastructure/api/types'
import { PATHS } from '@/domain/constants/routes'
import { formatPrice } from '@/shared/lib/format'
import { formatRelativeTime } from '@/shared/lib/format-relative-time'
import { AdminLayout } from '@/presentation/features/admin/admin-layout'
import { AdminCharts } from '@/presentation/features/admin/admin-charts'
import type { TranslationKey } from '@/infrastructure/i18n'

const POLL_MS = 30_000

interface KpiItem {
  key: string
  labelKey: TranslationKey
  value: string
  icon: typeof Users
  href?: string
  accent?: 'danger' | 'warning' | 'default'
}

export function AdminDashboard() {
  const { t, language } = useApp()
  const [stats, setStats] = useState<ApiAdminStats | null>(null)
  const [analytics, setAnalytics] = useState<ApiAdminAnalytics | null>(null)
  const [auditLogs, setAuditLogs] = useState<ApiAuditLog[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError('')
    try {
      const overview = await api.adminOverview()
      setStats(overview.stats)
      setAnalytics(overview.analytics)
      setAuditLogs(overview.audit_logs)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin_load_stats_failed'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [t])

  useEffect(() => {
    load()
    const id = window.setInterval(() => load(true), POLL_MS)
    return () => window.clearInterval(id)
  }, [load])

  const pendingDisputes = stats?.pending_disputes ?? (stats?.disputed_orders ?? 0) + (stats?.open_disputes ?? 0)
  const pendingWithdrawals = stats?.pending_withdrawals ?? 0

  const kpis: KpiItem[] = stats
    ? [
        { key: 'users', labelKey: 'admin_kpi_total_users', value: String(stats.users), icon: Users, href: PATHS.adminUsers },
        { key: 'active', labelKey: 'admin_kpi_active_users', value: String(stats.active_users_7d ?? 0), icon: Activity },
        { key: 'new', labelKey: 'admin_kpi_new_today', value: String(stats.new_users_today ?? 0), icon: UserPlus },
        { key: 'employers', labelKey: 'admin_kpi_employers', value: String(stats.employers ?? 0), icon: Building2 },
        { key: 'freelancers', labelKey: 'admin_kpi_freelancers', value: String(stats.freelancers ?? 0), icon: Users },
        { key: 'projects', labelKey: 'admin_kpi_projects', value: String(stats.projects), icon: Briefcase },
        { key: 'vacancies', labelKey: 'admin_kpi_vacancies', value: String(stats.vacancies ?? 0), icon: Briefcase },
        {
          key: 'revenue',
          labelKey: 'admin_kpi_revenue',
          value: formatPrice(stats.revenue_30d ?? analytics?.revenue_completed ?? 0),
          icon: TrendingUp,
          href: PATHS.adminFinance,
        },
        {
          key: 'escrow',
          labelKey: 'admin_kpi_escrow',
          value: formatPrice(stats.escrow_balance ?? 0),
          icon: Landmark,
          href: PATHS.adminEscrow,
        },
        {
          key: 'disputes',
          labelKey: 'admin_kpi_disputes',
          value: String(pendingDisputes),
          icon: Scale,
          href: PATHS.adminDisputes,
          accent: pendingDisputes > 0 ? 'danger' : 'default',
        },
        {
          key: 'withdrawals',
          labelKey: 'admin_kpi_withdrawals',
          value: String(pendingWithdrawals),
          icon: Wallet,
          href: PATHS.adminFinance,
          accent: pendingWithdrawals > 0 ? 'warning' : 'default',
        },
      ]
    : []

  const actionQueue = [
    pendingWithdrawals > 0 && {
      label: t('admin_withdrawals'),
      count: pendingWithdrawals,
      href: PATHS.adminFinance,
    },
    pendingDisputes > 0 && {
      label: t('admin_nav_disputes'),
      count: pendingDisputes,
      href: PATHS.adminDisputes,
    },
  ].filter(Boolean) as { label: string; count: number; href: string }[]

  return (
    <AdminLayout onRefresh={() => load(true)} refreshing={refreshing}>
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      {loading && !stats ? (
        <LoadingBlock className="py-16" />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
            {kpis.map((kpi) => {
              const Icon = kpi.icon
              const inner = (
                <Card
                  key={kpi.key}
                  className={`admin-kpi-card p-4 transition-shadow hover:shadow-md ${
                    kpi.href ? 'cursor-pointer' : ''
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--admin-muted)]">
                      {t(kpi.labelKey)}
                    </span>
                    <Icon
                      className={`size-4 ${
                        kpi.accent === 'danger'
                          ? 'text-[var(--admin-danger)]'
                          : kpi.accent === 'warning'
                            ? 'text-[var(--admin-warning)]'
                            : 'text-[var(--admin-muted)]'
                      }`}
                      aria-hidden
                    />
                  </div>
                  <p
                    className={`text-[26px] font-bold leading-none tracking-tight ${
                      kpi.accent === 'danger'
                        ? 'text-[var(--admin-danger)]'
                        : kpi.accent === 'warning'
                          ? 'text-[var(--admin-warning)]'
                          : 'text-[var(--admin-text)]'
                    }`}
                  >
                    {kpi.value}
                  </p>
                </Card>
              )
              return kpi.href ? (
                <Link key={kpi.key} href={kpi.href} className="block">
                  {inner}
                </Link>
              ) : (
                inner
              )
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-1">
              <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
                {t('admin_action_queue')}
              </h2>
              {actionQueue.length === 0 ? (
                <p className="text-sm text-[var(--admin-muted)]">{t('admin_action_queue_empty')}</p>
              ) : (
                <ul className="space-y-2">
                  {actionQueue.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="admin-queue-item flex min-h-11 items-center justify-between rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm transition-colors hover:bg-[var(--admin-bg)]"
                      >
                        <span className="font-medium text-[var(--admin-text)]">{item.label}</span>
                        <span className="flex items-center gap-2">
                          <span className="rounded-full bg-[var(--admin-warning)]/15 px-2 py-0.5 text-[12px] font-semibold text-[var(--admin-warning)]">
                            {t('admin_pending_count').replace('{n}', String(item.count))}
                          </span>
                          <ArrowRight className="size-4 text-[var(--admin-muted)]" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-5 lg:col-span-2">
              <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
                {t('admin_analytics_section')}
              </h2>
              {analytics ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    { label: t('admin_growth_users'), value: String(analytics.new_users) },
                    { label: t('admin_growth_revenue'), value: formatPrice(analytics.revenue_completed) },
                    { label: t('admin_growth_projects'), value: String(stats?.projects ?? 0) },
                    { label: t('admin_conversion'), value: `${analytics.conversion_rate}%` },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border border-[var(--admin-border)] p-3">
                      <p className="text-[11px] text-[var(--admin-muted)]">{item.label}</p>
                      <p className="mt-1 text-xl font-bold text-[var(--admin-text)]">{item.value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--admin-muted)]">—</p>
              )}
              {analytics && (
                <div className="mt-5">
                  <AdminCharts
                    analytics={analytics}
                    usersLabel={t('admin_chart_users')}
                    revenueLabel={t('admin_chart_revenue')}
                    emptyLabel={t('admin_chart_empty')}
                  />
                </div>
              )}
            </Card>
          </div>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
                {t('admin_activity_feed')}
              </h2>
              <Link href={PATHS.adminModeration}>
                <Button variant="ghost" size="sm">
                  {t('admin_view_all')}
                </Button>
              </Link>
            </div>
            {auditLogs.length === 0 ? (
              <p className="text-sm text-[var(--admin-muted)]">{t('admin_activity_empty')}</p>
            ) : (
              <ul className="divide-y divide-[var(--admin-border)]">
                {auditLogs.map((log) => (
                  <li key={log.id} className="flex flex-wrap items-start justify-between gap-2 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--admin-text)]">{log.action}</p>
                      {(log.entity_type || log.entity_id) && (
                        <p className="text-[12px] text-[var(--admin-muted)]">
                          {[log.entity_type, log.entity_id?.slice(0, 8)].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                    <time className="shrink-0 text-[12px] text-[var(--admin-muted)]">
                      {log.created_at ? formatRelativeTime(log.created_at, language) : '—'}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </AdminLayout>
  )
}
