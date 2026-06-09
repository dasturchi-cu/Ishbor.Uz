'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { Alert } from '@/presentation/components/ui/alert'
import { LoadErrorAlert } from '@/presentation/components/ui/load-error-alert'
import { Button } from '@/presentation/components/ui/button'
import { StatCard } from '@/presentation/components/ui/stat-card'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { OrderStatusBadge } from '@/presentation/components/features/order-status-badge'
import { PaymentStatusBadge } from '@/presentation/components/features/payment-status-badge'
import {
  DollarSign,
  Package,
  Star,
  Eye,
  Wallet,
  Package as PackageIcon,
  ChevronRight,
  Plus,
  MessageCircle,
  ShoppingBag,
  CheckCircle2,
  Timer,
  TrendingUp,
  User,
} from 'lucide-react'
import { PATHS, servicePath, dashboardOrderPath } from '@/domain/constants/routes'
import type { ApiOrder } from '@/infrastructure/api/types'
import { formatPrice, orderProgress } from '@/shared/lib/format'
import { Skeleton } from '@/presentation/components/ui/skeleton'
import type { TranslationKey } from '@/infrastructure/i18n'
import { cn } from '@/shared/lib/utils'
import { ActivityTimeline } from '@/presentation/components/dashboard/activity-timeline'
import { AdminPanelBanner } from '@/presentation/components/layout/admin-panel-banner'
import { DashboardHero } from '@/presentation/components/dashboard/dashboard-hero'
import { DashboardRecommendedActions } from '@/presentation/components/dashboard/dashboard-recommended-actions'
import { DashboardQuickActions } from '@/presentation/components/dashboard/dashboard-quick-actions'
import { useDashboardSummary } from '@/shared/lib/use-dashboard-summary'
import { useBadgeCounts } from '@/application/providers/badge-counts-provider'
import { FreelancerOnboardingChecklist } from '@/presentation/components/dashboard/freelancer-onboarding-checklist'
import { freelancerOnboardingProgress } from '@/shared/lib/onboarding-progress'

const ACTIVE_STATUSES = new Set(['pending', 'active', 'delivered'])

const CATEGORY_KEYS: Record<string, TranslationKey> = {
  web: 'cat_web',
  mobile: 'cat_mobile',
  uiux: 'cat_uiux',
  graphic: 'cat_graphic',
  writing: 'cat_writing',
  video: 'cat_video',
  seo: 'cat_seo',
}

function isThisMonth(dateStr?: string): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

function orderEarningsDate(order: ApiOrder): string | undefined {
  return order.updated_at ?? order.created_at
}

function isLastMonth(dateStr?: string): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = new Date()
  const last = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return d.getMonth() === last.getMonth() && d.getFullYear() === last.getFullYear()
}

function formatResponseHours(hours: number | null | undefined, t: (k: TranslationKey) => string): string {
  if (hours == null) return t('response_time_unknown')
  if (hours < 1) return '<1h'
  if (hours < 24) return `${Math.round(hours)}h`
  return `${Math.round(hours / 24)}d`
}

function DashboardPanel({
  title,
  action,
  children,
  className,
  id,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  id?: string
}) {
  return (
    <section id={id} className={cn(className ?? 'dashboard-panel', id && 'scroll-mt-24')}>
      <div className="dashboard-panel-header">
        <h2 className="dashboard-panel-title">{title}</h2>
        {action}
      </div>
      <div className="dashboard-panel-body">{children}</div>
    </section>
  )
}

function OrderRowSkeleton() {
  return (
    <div className="rounded-[var(--r-md)] border border-[var(--kwork-border)] p-3.5">
      <div className="mb-2 flex justify-between gap-3">
        <div className="space-y-2">
          <div className="h-4 w-36 animate-pulse rounded bg-[var(--color-bg-muted)]" />
          <div className="h-3 w-24 animate-pulse rounded bg-[var(--color-bg-muted)]" />
        </div>
        <div className="h-6 w-20 animate-pulse rounded-full bg-[var(--color-bg-muted)]" />
      </div>
      <div className="h-1.5 animate-pulse rounded-full bg-[var(--color-bg-muted)]" />
    </div>
  )
}

export function FreelancerDashboard() {
  const { t, profile, userId, isAuthLoading, isLoggedIn } = useApp()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { messageUnread, notificationUnread } = useBadgeCounts()
  const authReady = !isAuthLoading && isLoggedIn && Boolean(userId)

  const { orders, services, reviewStats, reputation, loading, error, loadError, reload } = useDashboardSummary(
    userId,
    'freelancer',
    authReady
  )

  const [showCreatedBanner, setShowCreatedBanner] = useState(false)
  const [birjaSeen, setBirjaSeen] = useState(false)

  useEffect(() => {
    try {
      setBirjaSeen(localStorage.getItem('ishbor_onboarding_birja_seen') === '1')
    } catch {
      setBirjaSeen(false)
    }
  }, [])

  const onboardingProgress = useMemo(
    () => freelancerOnboardingProgress(profile, services, orders.length > 0, birjaSeen),
    [profile, services, orders.length, birjaSeen]
  )

  useEffect(() => {
    if (searchParams.get('created') === '1') {
      setShowCreatedBanner(true)
      router.replace(PATHS.dashboardFreelancer)
    }
  }, [searchParams, router])

  const metrics = useMemo(() => {
    const completed = orders.filter((o) => o.status === 'completed')
    const active = orders.filter((o) => ACTIVE_STATUSES.has(o.status))
    const monthlyEarnings = completed
      .filter((o) => isThisMonth(orderEarningsDate(o)))
      .reduce((sum, o) => sum + o.amount, 0)
    const lastMonthEarnings = completed
      .filter((o) => isLastMonth(orderEarningsDate(o)))
      .reduce((sum, o) => sum + o.amount, 0)
    const earningsPct =
      lastMonthEarnings > 0
        ? Math.round(((monthlyEarnings - lastMonthEarnings) / lastMonthEarnings) * 100)
        : monthlyEarnings > 0
          ? 100
          : 0

    const hasEarnings = monthlyEarnings > 0
    const hasActive = active.length > 0
    const hasReviews = reviewStats.count > 0
    const hasServices = services.length > 0
    const hasCompleted = completed.length > 0
    const hasSuccessRate = reputation != null && reputation.success_rate > 0
    const hasResponse = reputation?.response_time_hours != null

    const pipelineAmount = orders
      .filter((o) => o.status === 'active' || o.status === 'delivered' || o.status === 'pending')
      .reduce((sum, o) => sum + o.amount, 0)

    return {
      pipelineForecast: pipelineAmount,
      monthlyEarnings: hasEarnings ? formatPrice(monthlyEarnings) : '0 so\'m',
      earningsChange: hasEarnings
        ? t('stat_vs_last_month').replace('{pct}', String(Math.abs(earningsPct)))
        : t('stat_no_data'),
      earningsPositive: earningsPct >= 0,
      earningsNeutral: !hasEarnings,
      activeCount: String(active.length),
      activeChange: hasActive ? undefined : t('stat_no_data'),
      activeNeutral: !hasActive,
      completedCount: String(completed.length),
      completedNeutral: !hasCompleted,
      rating: reviewStats.average > 0 ? reviewStats.average.toFixed(1) : '—',
      ratingChange: hasReviews
        ? `${reviewStats.count} ${t('stat_reviews').toLowerCase()}`
        : t('stat_no_reviews'),
      ratingNeutral: !hasReviews,
      profileViews:
        profile?.profile_views != null && profile.profile_views > 0
          ? String(profile.profile_views)
          : hasServices
            ? '0'
            : '—',
      viewsChange:
        profile?.profile_views != null && profile.profile_views > 0
          ? t('stat_profile_views_hint')
          : hasServices
            ? t('stat_coming_soon')
            : t('stat_profile_views_hint'),
      viewsNeutral: !(profile?.profile_views && profile.profile_views > 0) && !hasServices,
      successRate: hasSuccessRate ? `${Math.round(reputation!.success_rate)}%` : '—',
      successNeutral: !hasSuccessRate,
      responseTime: formatResponseHours(reputation?.response_time_hours, t),
      responseNeutral: !hasResponse,
      walletTotal:
        profile?.wallet_balance != null
          ? profile.wallet_balance
          : completed.reduce((sum, o) => sum + o.amount, 0),
      pipelineForecastLabel:
        pipelineAmount > 0
          ? t('freelancer_earnings_forecast').replace('{amount}', formatPrice(pipelineAmount))
          : '',
    }
  }, [orders, reviewStats, services.length, t, profile?.wallet_balance, profile?.profile_views, reputation])

  const activeOrders = useMemo(
    () => orders.filter((o) => ACTIVE_STATUSES.has(o.status)),
    [orders]
  )

  const pendingPayments = useMemo(
    () => orders.filter((o) => o.payment_status === 'held' && o.status !== 'completed'),
    [orders]
  )

  const readyToAccept = useMemo(
    () => orders.filter((o) => o.status === 'pending' && o.payment_status === 'held'),
    [orders]
  )

  const awaitingClientPayment = useMemo(
    () => orders.filter((o) => o.status === 'pending' && o.payment_status !== 'held'),
    [orders]
  )

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
        .slice(0, 4),
    [orders]
  )

  const primaryCta =
    services.length === 0
      ? { label: t('dash_action_create_service'), href: PATHS.dashboardServicesNew }
      : readyToAccept.length > 0
        ? { label: t('accept_order'), href: dashboardOrderPath(readyToAccept[0].id) }
        : { label: t('dash_action_find_orders'), href: PATHS.dashboardOrders }

  const viewAllServicesLink = (
    <Link
      href={PATHS.dashboardServices}
      className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--color-primary)] hover:underline"
    >
      {t('view_all_services')}
      <ChevronRight className="h-4 w-4" />
    </Link>
  )

  return (
    <div className="dash-home space-y-5 pb-2">
      {error && (
        <LoadErrorAlert error={loadError} scope="dashboard" onRetry={reload} />
      )}
      {showCreatedBanner && <Alert variant="success">{t('service_created')}</Alert>}

      {readyToAccept.length > 0 && (
        <Alert variant="info">
          <p className="text-[13px] font-medium">
            {t('freelancer_ready_accept_banner').replace('{n}', String(readyToAccept.length))}
          </p>
          <Link
            href={dashboardOrderPath(readyToAccept[0].id)}
            className="mt-2 inline-block text-[13px] font-semibold text-[var(--color-primary)] hover:underline"
          >
            {t('accept_order')} →
          </Link>
        </Alert>
      )}

      {awaitingClientPayment.length > 0 && (
        <Alert variant="info">
          <p className="text-[13px] text-[var(--kwork-text-muted)]">
            {t('freelancer_awaiting_payment_banner').replace('{n}', String(awaitingClientPayment.length))}
          </p>
        </Alert>
      )}

      <AdminPanelBanner />

      <DashboardHero
        role="freelancer"
        activeOrders={activeOrders.length}
        pendingPayments={pendingPayments.length}
        messageUnread={messageUnread}
        notificationUnread={notificationUnread}
        walletBalance={profile?.wallet_balance ?? null}
        primaryCta={primaryCta}
        orders={orders}
        onboardingProgress={onboardingProgress}
      />

      <FreelancerOnboardingChecklist
        services={services}
        hasOrders={orders.length > 0}
      />

      <DashboardRecommendedActions
        role="freelancer"
        services={services}
        projects={[]}
        orders={orders}
        messageUnread={messageUnread}
      />

      <DashboardQuickActions
        items={[
          { href: PATHS.dashboardServicesNew, icon: Plus, labelKey: 'dash_action_create_service' },
          { href: PATHS.dashboardOrders, icon: ShoppingBag, labelKey: 'dash_action_find_orders' },
          { href: PATHS.dashboardWallet, icon: Wallet, labelKey: 'dash_kpi_wallet' },
          { href: PATHS.dashboardMessages, icon: MessageCircle, labelKey: 'dash_action_open_chat' },
          { href: PATHS.dashboardProfile, icon: User, labelKey: 'dash_action_complete_profile' },
        ]}
      />

      <div className="dash-stats-grid">
        <StatCard
          icon={DollarSign}
          iconTone="success"
          label={t('stat_monthly_earnings')}
          value={metrics.monthlyEarnings}
          change={metrics.earningsChange}
          changePositive={metrics.earningsPositive}
          changeNeutral={metrics.earningsNeutral}
          loading={loading}
        />
        <StatCard
          icon={Package}
          iconTone="primary"
          label={t('active_projects')}
          value={metrics.activeCount}
          change={metrics.activeChange}
          changeNeutral={metrics.activeNeutral}
          loading={loading}
        />
        <StatCard
          icon={CheckCircle2}
          iconTone="success"
          label={t('stat_completed_work')}
          value={metrics.completedCount}
          changeNeutral={metrics.completedNeutral}
          loading={loading}
        />
        <StatCard
          icon={Star}
          iconTone="warning"
          label={t('stat_avg_rating')}
          value={metrics.rating}
          change={metrics.ratingChange}
          changeNeutral={metrics.ratingNeutral}
          loading={loading}
        />
        <StatCard
          icon={Eye}
          iconTone="primary"
          label={t('stat_profile_views')}
          value={metrics.profileViews}
          change={metrics.viewsChange}
          changeNeutral={metrics.viewsNeutral}
          loading={loading}
        />
        <StatCard
          icon={Timer}
          iconTone="purple"
          label={t('response_time')}
          value={metrics.responseTime}
          changeNeutral={metrics.responseNeutral}
          loading={loading}
        />
        <StatCard
          icon={TrendingUp}
          iconTone="success"
          label={t('stat_success_rate')}
          value={metrics.successRate}
          changeNeutral={metrics.successNeutral}
          loading={loading}
        />
      </div>

      {!loading && metrics.pipelineForecastLabel ? (
        <p className="mb-4 text-sm text-muted-foreground" title={t('freelancer_earnings_forecast_hint')}>
          {metrics.pipelineForecastLabel}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr] lg:items-start">
        <DashboardPanel id="orders" title={t('nav_orders')}>
          {loading ? (
            <div className="space-y-2.5">
              {[0, 1].map((i) => (
                <OrderRowSkeleton key={i} />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <EmptyState
              compact
              icon={<PackageIcon />}
              title={t('no_orders_yet')}
              description={t('freelancer_no_orders_desc')}
              action={{
                label: t('create_service_title'),
                onClick: () => router.push(PATHS.dashboardServicesNew),
                variant: 'outline',
              }}
            />
          ) : (
            <div className="space-y-2.5">
              {recentOrders.map((order) => {
                const progress = orderProgress(order.status)
                return (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => router.push(dashboardOrderPath(order.id))}
                    className="w-full rounded-[var(--r-md)] border border-[var(--kwork-border)] p-3.5 text-left transition hover:border-[color-mix(in_srgb,var(--color-primary)_25%,var(--kwork-border))] hover:bg-[var(--neutral-50)]"
                  >
                    <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="truncate text-[14px] font-semibold text-[var(--kwork-text)]">
                          {order.services?.title ?? t('nav_orders')}
                        </h3>
                        <p className="mt-0.5 text-[12px] text-[var(--kwork-text-muted)]">
                          {order.client_profile?.full_name ?? t('value_not_available')} · {formatPrice(order.amount)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <OrderStatusBadge status={order.status} />
                        <PaymentStatusBadge status={order.payment_status} />
                      </div>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-bg-muted)]">
                      <div
                        className="h-full rounded-full bg-[var(--color-primary)] transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </button>
                )
              })}
              <Link
                href={PATHS.dashboardOrders}
                className="inline-flex items-center gap-1 pt-1 text-[13px] font-semibold text-[var(--color-primary)] hover:underline"
              >
                {t('view_all_orders')}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </DashboardPanel>

        <div className="space-y-4">
          <section className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--kwork-border)] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark,#1d4ed8)] text-white shadow-[var(--shadow-xs)]">
            <div className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                <h2 className="text-[16px] font-semibold">{t('wallet')}</h2>
              </div>
              <p className="text-[12px] text-white/75">{t('wallet_balance_label')}</p>
              <div className="mt-1 text-[28px] font-bold tabular-nums tracking-tight">
                {loading ? <Skeleton className="h-8 w-32 bg-white/20" /> : formatPrice(metrics.walletTotal)}
              </div>
              <p className="mt-1 text-[12px] text-white/70">{t('wallet_balance_hint')}</p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Link href={PATHS.dashboardWallet} className="flex-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-white/30 bg-white/10 text-white hover:bg-white/20"
                  >
                    {t('withdraw_money')}
                  </Button>
                </Link>
                <Link href={PATHS.dashboardEscrow} className="flex-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-white/20 bg-transparent text-white hover:bg-white/10"
                  >
                    {t('nav_escrow')} →
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          <DashboardPanel title={t('recent_activity')}>
            {loading ? (
              <div className="space-y-2.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded bg-[var(--color-bg-muted)]" />
                ))}
              </div>
            ) : (
              <ActivityTimeline />
            )}
          </DashboardPanel>
        </div>
      </div>

      <DashboardPanel
        id="services"
        title={t('nav_my_services')}
        action={services.length > 0 ? viewAllServicesLink : undefined}
      >
        {loading ? (
          <div className="space-y-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-[var(--r-md)] bg-[var(--color-bg-muted)]" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <EmptyState
            compact
            icon={<PackageIcon />}
            title={t('no_services_yet')}
            description={t('freelancer_no_services_desc')}
            action={{
              label: t('create_service_title'),
              onClick: () => router.push(PATHS.dashboardServicesNew),
              variant: 'outline',
            }}
          />
        ) : (
          <div className="space-y-2.5">
            {services.slice(0, 3).map((service) => {
              const categoryKey = CATEGORY_KEYS[service.category]
              return (
                <div
                  key={service.id}
                  className={cn(
                    'flex flex-col gap-3 rounded-[var(--r-md)] border border-[var(--kwork-border)] p-3.5 sm:flex-row sm:items-center sm:justify-between',
                    'transition hover:border-[color-mix(in_srgb,var(--color-primary)_25%,var(--kwork-border))] hover:bg-[var(--neutral-50)]'
                  )}
                >
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-[var(--kwork-text)]">{service.title}</h3>
                    <p className="mt-0.5 text-[12px] text-[var(--kwork-text-muted)]">
                      {service.region}
                      {categoryKey ? ` · ${t(categoryKey)}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <p className="font-bold tabular-nums text-[var(--kwork-text)]">{formatPrice(service.price)}</p>
                    <Button size="sm" variant="outline" onClick={() => router.push(servicePath(service.id))}>
                      {t('view')}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </DashboardPanel>

    </div>
  )
}
