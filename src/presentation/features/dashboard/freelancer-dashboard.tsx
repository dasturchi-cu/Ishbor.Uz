'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { Alert } from '@/presentation/components/ui/alert'
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
  Briefcase,
  ShoppingBag,
} from 'lucide-react'
import { PATHS, servicePath, dashboardOrderPath } from '@/domain/constants/routes'
import { api } from '@/infrastructure/api/client'
import type { ApiOrder, ApiService } from '@/infrastructure/api/types'
import { formatPrice, orderProgress } from '@/shared/lib/format'
import { Skeleton } from '@/presentation/components/ui/skeleton'
import type { TranslationKey } from '@/infrastructure/i18n'
import { cn } from '@/shared/lib/utils'
import { ActivityTimeline } from '@/presentation/components/dashboard/activity-timeline'
import { FreelancerOnboardingChecklist } from '@/presentation/components/dashboard/freelancer-onboarding-checklist'
import { ReferralBanner } from '@/presentation/components/layout/referral-banner'
import { AdminPanelBanner } from '@/presentation/components/layout/admin-panel-banner'
import { ProfileCompletionBar } from '@/presentation/components/layout/profile-completion-bar'

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

function QuickActionCard({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href?: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick?: () => void
}) {
  const className =
    'kwork-card flex flex-col items-center gap-2 px-3 py-3 text-center'

  const content = (
    <>
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-[12px] font-semibold text-[var(--kwork-text)]">{label}</span>
    </>
  )

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  )
}

export function FreelancerDashboard() {
  const { t, profile, userId } = useApp()
  const router = useRouter()
  const searchParams = useSearchParams()
  const firstName = profile?.full_name?.split(/\s+/)[0]

  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [services, setServices] = useState<ApiService[]>([])
  const [reviewStats, setReviewStats] = useState({ average: 0, count: 0 })
  const [showCreatedBanner, setShowCreatedBanner] = useState(false)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (searchParams.get('created') === '1') {
      setShowCreatedBanner(true)
      router.replace(PATHS.dashboardFreelancer)
    }
  }, [searchParams, router])

  const loadDashboard = useCallback(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setLoadError(false)
    let failed = false
    Promise.all([
      api.listOrders().catch(() => {
        failed = true
        return [] as ApiOrder[]
      }),
      api.getFreelancerReviewStats(userId).catch(() => ({ average: 0, count: 0 })),
      api.listMyServices().catch(() => {
        failed = true
        return [] as ApiService[]
      }),
    ])
      .then(([ordersData, stats, servicesData]) => {
        setOrders(ordersData)
        setReviewStats(stats)
        setServices(servicesData)
        if (failed) setLoadError(true)
      })
      .finally(() => setLoading(false))
  }, [userId])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

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

    return {
      monthlyEarnings: hasEarnings ? formatPrice(monthlyEarnings) : '0 so\'m',
      earningsChange: hasEarnings
        ? t('stat_vs_last_month').replace('{pct}', String(Math.abs(earningsPct)))
        : t('stat_no_data'),
      earningsPositive: earningsPct >= 0,
      earningsNeutral: !hasEarnings,
      activeCount: String(active.length),
      activeChange: hasActive ? undefined : t('stat_no_data'),
      activeNeutral: !hasActive,
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
      walletTotal:
        profile?.wallet_balance != null
          ? profile.wallet_balance
          : completed.reduce((sum, o) => sum + o.amount, 0),
    }
  }, [orders, reviewStats, services.length, t, profile?.wallet_balance, profile?.profile_views])

  const readyToAccept = useMemo(
    () => orders.filter((o) => o.status === 'pending' && o.payment_status === 'held'),
    [orders],
  )

  const awaitingClientPayment = useMemo(
    () => orders.filter((o) => o.status === 'pending' && o.payment_status !== 'held'),
    [orders],
  )

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
        .slice(0, 4),
    [orders]
  )

  const viewAllServicesLink = (
    <Link
      href={PATHS.dashboardServices}
      className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--color-primary)] hover:underline"
    >
      {t('view_all_services')}
      <ChevronRight className="h-4 w-4" />
    </Link>
  )

  const reloadDashboard = loadDashboard

  return (
    <div className="space-y-5 pb-2">
      {loadError && (
        <Alert variant="error">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{t('data_load_failed')}</span>
            <Button variant="outline" size="sm" onClick={reloadDashboard}>
              {t('catalog_retry')}
            </Button>
          </div>
        </Alert>
      )}
      {showCreatedBanner && (
        <Alert variant="success">{t('service_created')}</Alert>
      )}

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

      <ProfileCompletionBar />

      <AdminPanelBanner />

      <div className="dashboard-welcome flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-primary)]">
              {t('freelancer_dashboard')}
            </p>
            <h2 className="mt-1 text-[22px] font-bold text-[var(--kwork-text)] md:text-[26px]">
              {t('welcome_back')}
              {firstName ? `, ${firstName}` : ''}
            </h2>
            <p className="mt-1.5 max-w-xl text-[14px] leading-relaxed text-[var(--kwork-text-muted)]">
              {t('freelancer_dashboard_sub')}
            </p>
          </div>
          <Link href={PATHS.dashboardServicesNew} className="shrink-0">
            <Button variant="primary" size="md" className="w-full rounded-full sm:w-auto" leftIcon={<Plus className="h-4 w-4" />}>
              {t('create_service_title')}
            </Button>
          </Link>
        </div>

        <div>
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--kwork-text-muted)]">
            {t('quick_actions_title')}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            <QuickActionCard href={PATHS.dashboardServices} icon={Package} label={t('nav_my_services')} />
            <QuickActionCard href={PATHS.dashboardOrders} icon={ShoppingBag} label={t('nav_orders')} />
            <QuickActionCard href={PATHS.postProject} icon={Briefcase} label={t('nav_birja')} />
            <QuickActionCard href={PATHS.dashboardMessages} icon={MessageCircle} label={t('nav_messages')} />
          </div>
        </div>
      </div>

      {!loading && (
        <FreelancerOnboardingChecklist services={services} hasOrders={orders.length > 0} />
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
            {services.slice(0, 4).map((service) => {
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
                <Link href={PATHS.dashboardWallet} className="flex-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-white/20 bg-transparent text-white hover:bg-white/10"
                  >
                    {t('nav_wallet')} →
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

      <ReferralBanner />
    </div>
  )
}
