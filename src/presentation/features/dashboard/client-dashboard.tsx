'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { Alert } from '@/presentation/components/ui/alert'
import { LoadErrorAlert } from '@/presentation/components/ui/load-error-alert'
import { Button } from '@/presentation/components/ui/button'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { OrderStatusBadge } from '@/presentation/components/features/order-status-badge'
import { PaymentStatusBadge } from '@/presentation/components/features/payment-status-badge'
import { ShoppingBag, ChevronRight, FolderKanban, MapPin } from 'lucide-react'
import { PATHS, dashboardOrderPath, projectPath } from '@/domain/constants/routes'
import type { ApiOrder } from '@/infrastructure/api/types'
import { formatPrice, orderProgress } from '@/shared/lib/format'
import { ReviewModal } from '@/presentation/components/features/review-modal'
import { DashboardHero } from '@/presentation/components/dashboard/dashboard-hero'
import { DashboardRecommendedActions } from '@/presentation/components/dashboard/dashboard-recommended-actions'
import { useDashboardSummary } from '@/shared/lib/use-dashboard-summary'
import { useBadgeCounts } from '@/application/providers/badge-counts-provider'
import { ClientOnboardingChecklist } from '@/presentation/components/dashboard/client-onboarding-checklist'
import { OrderRowSkeleton } from '@/presentation/components/dashboard/order-row-skeleton'
import { clientOnboardingProgress } from '@/shared/lib/onboarding-progress'
import { useOnboardingChecklistVisible } from '@/shared/lib/onboarding-session-limit'
import { cn } from '@/shared/lib/utils'

const ACTIVE_STATUSES = new Set(['pending', 'active', 'delivered'])

function DashboardPanel({
  title,
  action,
  children,
  className,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('dashboard-panel', className)}>
      <div className="dashboard-panel-header">
        <h2 className="dashboard-panel-title">{title}</h2>
        {action}
      </div>
      <div className="dashboard-panel-body">{children}</div>
    </section>
  )
}

export function ClientDashboard() {
  const { t, profile, userId, isAuthLoading, isLoggedIn } = useApp()
  const router = useRouter()
  const { messageUnread } = useBadgeCounts()
  const authReady = !isAuthLoading && isLoggedIn && Boolean(userId)

  const { orders, projects, loading, error, loadError, reload } = useDashboardSummary(userId, 'client', authReady)
  const [reviewOrder, setReviewOrder] = useState<ApiOrder | null>(null)

  const deliveredForReview = useMemo(
    () => orders.filter((o) => o.status === 'delivered'),
    [orders]
  )

  const unpaidOrders = useMemo(
    () => orders.filter((o) => o.status === 'pending' && o.payment_status !== 'held'),
    [orders]
  )

  const activeOrders = useMemo(
    () => orders.filter((o) => ACTIVE_STATUSES.has(o.status)),
    [orders]
  )

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
        .slice(0, 4),
    [orders]
  )

  const onboardingProgress = useMemo(
    () => clientOnboardingProgress(profile, projects, orders.length > 0),
    [profile, projects, orders.length]
  )
  const onboardingChecklistVisible = useOnboardingChecklistVisible(onboardingProgress.complete)

  const primaryCta =
    projects.length === 0
      ? { label: t('dash_action_post_project'), href: PATHS.postProject }
      : unpaidOrders.length > 0
        ? { label: t('payment_pay_now'), href: dashboardOrderPath(unpaidOrders[0].id) }
        : { label: t('dash_action_browse_services'), href: PATHS.services }

  const panelLoading = loading

  return (
    <div className="dash-home space-y-5 pb-2">
      {error && (
        <LoadErrorAlert
          error={loadError}
          scope="dashboard"
          onRetry={reload}
          context={{ queryKey: 'dashboard/summary', apiPath: '/api/v1/dashboard/summary?role=client' }}
        />
      )}

      {unpaidOrders.length > 0 && primaryCta.href !== dashboardOrderPath(unpaidOrders[0].id) && (
        <Alert variant="info">
          <p className="text-[13px] font-medium">{t('unpaid_orders_banner').replace('{n}', String(unpaidOrders.length))}</p>
          <Link href={dashboardOrderPath(unpaidOrders[0].id)} className="mt-2 inline-block text-[13px] font-semibold text-[var(--color-primary)] hover:underline">
            {t('payment_pay_now')} →
          </Link>
        </Alert>
      )}

      {!loading && deliveredForReview.length > 0 && unpaidOrders.length === 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary-light)]/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[14px] font-medium text-[var(--ishbor-text)]">{t('review_pending_banner')}</p>
          <Button variant="primary" size="sm" onClick={() => setReviewOrder(deliveredForReview[0])}>
            {t('leave_review')}
          </Button>
        </div>
      )}

      <DashboardHero
        role="client"
        activeOrders={activeOrders.length}
        pendingPayments={unpaidOrders.length}
        messageUnread={messageUnread}
        walletBalance={profile?.wallet_balance ?? null}
        primaryCta={primaryCta}
        orders={orders}
        onboardingProgress={onboardingProgress}
      />

      {onboardingChecklistVisible ? (
        <ClientOnboardingChecklist projects={projects} hasOrders={orders.length > 0} />
      ) : (
        <DashboardRecommendedActions
          role="client"
          services={[]}
          projects={projects}
          orders={orders}
          messageUnread={messageUnread}
          hidePaymentRecommendation={unpaidOrders.length > 0}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <DashboardPanel title={t('nav_orders')}>
          {panelLoading ? (
            <div className="space-y-2.5">
              {[0, 1].map((i) => (
                <OrderRowSkeleton key={i} />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <EmptyState
              compact
              icon={<ShoppingBag />}
              title={t('no_orders_yet')}
              description={t('no_orders_desc')}
              action={{ label: t('browse_services'), onClick: () => router.push(PATHS.services) }}
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
                          {order.freelancer_profile?.full_name ?? t('value_not_available')} · {formatPrice(order.amount)}
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

        <DashboardPanel title={t('my_projects')}>
          {panelLoading ? (
            <div className="h-14 animate-pulse rounded-[var(--r-md)] bg-[var(--color-bg-muted)]" />
          ) : projects.length === 0 ? (
            <EmptyState
              compact
              icon={<FolderKanban />}
              title={t('no_projects_yet')}
              description={t('client_find_freelancer_hint')}
              action={{ label: t('post_new_project'), onClick: () => router.push(PATHS.postProject) }}
            />
          ) : (
            <div className="space-y-2">
              {projects.slice(0, 4).map((p) => (
                <Link key={p.id} href={projectPath(p.id)} className="dashboard-project-row block hover:bg-[var(--neutral-50)]">
                  <div className="min-w-0">
                    <h3 className="truncate text-[14px] font-semibold text-[var(--ishbor-text)]">{p.title}</h3>
                    {p.region && (
                      <p className="mt-0.5 flex items-center gap-1 text-[12px] text-[var(--ishbor-text-muted)]">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{p.region}</span>
                      </p>
                    )}
                  </div>
                  <p className="shrink-0 text-[14px] font-bold text-[var(--color-primary)]">
                    {formatPrice(p.budget)}
                  </p>
                </Link>
              ))}
              <Link
                href={PATHS.dashboardProjects}
                className="inline-flex items-center gap-1 pt-1 text-[13px] font-semibold text-[var(--color-primary)] hover:underline"
              >
                {t('view_all_projects')}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </DashboardPanel>
      </div>

      {reviewOrder && (
        <ReviewModal
          orderId={reviewOrder.id}
          serviceTitle={reviewOrder.services?.title}
          onClose={() => setReviewOrder(null)}
          onSubmitted={() => setReviewOrder(null)}
        />
      )}
    </div>
  )
}
