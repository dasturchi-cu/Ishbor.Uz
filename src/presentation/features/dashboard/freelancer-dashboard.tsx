'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { Alert } from '@/presentation/components/ui/alert'
import { LoadErrorAlert } from '@/presentation/components/ui/load-error-alert'
import { Button } from '@/presentation/components/ui/button'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { OrderStatusBadge } from '@/presentation/components/features/order-status-badge'
import { PaymentStatusBadge } from '@/presentation/components/features/payment-status-badge'
import { Package as PackageIcon, ChevronRight } from 'lucide-react'
import { PATHS, servicePath, dashboardOrderPath } from '@/domain/constants/routes'
import { formatPrice, orderProgress } from '@/shared/lib/format'
import type { TranslationKey } from '@/infrastructure/i18n'
import { cn } from '@/shared/lib/utils'
import { AdminPanelBanner } from '@/presentation/components/layout/admin-panel-banner'
import { DashboardHero } from '@/presentation/components/dashboard/dashboard-hero'
import { DashboardRecommendedActions } from '@/presentation/components/dashboard/dashboard-recommended-actions'
import { useDashboardSummary } from '@/shared/lib/use-dashboard-summary'
import { useBadgeCounts } from '@/application/providers/badge-counts-provider'
import { FreelancerOnboardingChecklist } from '@/presentation/components/dashboard/freelancer-onboarding-checklist'
import { OrderRowSkeleton } from '@/presentation/components/dashboard/order-row-skeleton'
import { freelancerOnboardingProgress } from '@/shared/lib/onboarding-progress'
import { useOnboardingChecklistVisible } from '@/shared/lib/onboarding-session-limit'

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
    <section id={id} className={cn('dashboard-panel', className, id && 'scroll-mt-24')}>
      <div className="dashboard-panel-header">
        <h2 className="dashboard-panel-title">{title}</h2>
        {action}
      </div>
      <div className="dashboard-panel-body">{children}</div>
    </section>
  )
}

export function FreelancerDashboard() {
  const { t, profile, userId, isAuthLoading, isLoggedIn } = useApp()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { messageUnread } = useBadgeCounts()
  const authReady = !isAuthLoading && isLoggedIn && Boolean(userId)

  const { orders, services, loading, error, loadError, reload } = useDashboardSummary(
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
  const onboardingChecklistVisible = useOnboardingChecklistVisible(onboardingProgress.complete)

  useEffect(() => {
    if (searchParams.get('created') === '1') {
      setShowCreatedBanner(true)
      router.replace(PATHS.dashboardFreelancer)
    }
  }, [searchParams, router])

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
        : { label: t('dash_action_find_orders'), href: PATHS.projects }

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
      {awaitingClientPayment.length > 0 ? (
        <Alert variant="info">
          <p className="text-[13px] text-[var(--ishbor-text-muted)]">
            {t('freelancer_awaiting_payment_banner').replace('{n}', String(awaitingClientPayment.length))}
          </p>
        </Alert>
      ) : showCreatedBanner ? (
        <Alert variant="success">{t('service_created')}</Alert>
      ) : null}

      <AdminPanelBanner />

      <DashboardHero
        role="freelancer"
        activeOrders={activeOrders.length}
        pendingPayments={pendingPayments.length}
        messageUnread={messageUnread}
        walletBalance={profile?.wallet_balance ?? null}
        primaryCta={primaryCta}
        orders={orders}
        onboardingProgress={onboardingProgress}
      />

      {onboardingChecklistVisible ? (
        <FreelancerOnboardingChecklist services={services} hasOrders={orders.length > 0} />
      ) : (
        <DashboardRecommendedActions
          role="freelancer"
          services={services}
          projects={[]}
          orders={orders}
          messageUnread={messageUnread}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
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
                    className="w-full rounded-[var(--r-md)] border border-[var(--ishbor-border)] p-3.5 text-left transition hover:border-[color-mix(in_srgb,var(--color-primary)_25%,var(--ishbor-border))] hover:bg-[var(--neutral-50)]"
                  >
                    <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="truncate text-[14px] font-semibold text-[var(--ishbor-text)]">
                          {order.services?.title ?? t('nav_orders')}
                        </h3>
                        <p className="mt-0.5 text-[12px] text-[var(--ishbor-text-muted)]">
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
                    'flex flex-col gap-3 rounded-[var(--r-md)] border border-[var(--ishbor-border)] p-3.5 sm:flex-row sm:items-center sm:justify-between',
                    'transition hover:border-[color-mix(in_srgb,var(--color-primary)_25%,var(--ishbor-border))] hover:bg-[var(--neutral-50)]'
                  )}
                >
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-[var(--ishbor-text)]">{service.title}</h3>
                    <p className="mt-0.5 text-[12px] text-[var(--ishbor-text-muted)]">
                      {service.region}
                      {categoryKey ? ` · ${t(categoryKey)}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <p className="font-bold tabular-nums text-[var(--ishbor-text)]">{formatPrice(service.price)}</p>
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

    </div>
  )
}
