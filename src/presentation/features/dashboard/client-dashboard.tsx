'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { StatCard } from '@/presentation/components/ui/stat-card'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { SkeletonFreelancerCard } from '@/presentation/components/ui/skeleton'
import { FreelancerCard } from '@/presentation/components/features/freelancer-card'
import { OrderStatusBadge } from '@/presentation/components/features/order-status-badge'
import {
  ShoppingBag,
  CheckCircle2,
  Clock,
  Wallet,
  ChevronRight,
  FolderKanban,
  Search,
  MapPin,
} from 'lucide-react'
import { PATHS, freelancerPath, dashboardOrderPath, projectPath } from '@/domain/constants/routes'
import { api } from '@/infrastructure/api/client'
import type { ApiOrder, ApiProfilePublic, ApiProject } from '@/infrastructure/api/types'
import { formatPrice, orderProgress } from '@/shared/lib/format'
import { ActivityTimeline } from '@/presentation/components/dashboard/activity-timeline'
import { ReferralBanner } from '@/presentation/components/layout/referral-banner'
import { ReviewModal } from '@/presentation/components/features/review-modal'

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
    <section className={className ?? 'dashboard-panel'}>
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

export function ClientDashboard() {
  const { t, profile, userId } = useApp()
  const router = useRouter()
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [freelancers, setFreelancers] = useState<ApiProfilePublic[]>([])
  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewOrder, setReviewOrder] = useState<ApiOrder | null>(null)

  const deliveredForReview = useMemo(
    () => orders.filter((o) => o.status === 'delivered'),
    [orders],
  )

  useEffect(() => {
    setLoading(true)
    Promise.all([
      userId ? api.listProjects({ client_id: userId }).catch(() => [] as ApiProject[]) : Promise.resolve([]),
      api.listFreelancers().catch(() => [] as ApiProfilePublic[]),
      userId ? api.listOrders().catch(() => [] as ApiOrder[]) : Promise.resolve([]),
    ])
      .then(([projectsData, freelancersData, ordersData]) => {
        setProjects(projectsData)
        setFreelancers(freelancersData)
        setOrders(ordersData)
      })
      .finally(() => setLoading(false))
  }, [userId])

  const metrics = useMemo(() => {
    const completed = orders.filter((o) => o.status === 'completed')
    const inProgress = orders.filter((o) => ['pending', 'active', 'delivered'].includes(o.status))
    const totalSpent = completed.reduce((sum, o) => sum + o.amount, 0)

    return {
      totalOrders: String(orders.length),
      completed: String(completed.length),
      inProgress: String(inProgress.length),
      totalSpent: totalSpent > 0 ? formatPrice(totalSpent) : '0 so\'m',
    }
  }, [orders])

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
        .slice(0, 4),
    [orders]
  )

  const firstName = profile?.full_name?.split(/\s+/)[0]
  const postProjectBtn = (
    <Button variant="outline" size="sm" onClick={() => router.push(PATHS.postProject)}>
      {t('post_new_project')}
    </Button>
  )

  return (
    <div className="space-y-5 pb-2">
      <div className="dashboard-welcome flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-primary)]">
            {t('nav_dashboard')}
          </p>
          <h1 className="mt-1 text-[22px] font-bold text-[var(--kwork-text)] md:text-[26px]">
            {t('client_dashboard')}
          </h1>
          <p className="mt-1.5 max-w-xl text-[14px] leading-relaxed text-[var(--kwork-text-muted)]">
            {t('manage_projects')}
            {firstName ? ` — ${firstName}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="md" className="rounded-full" onClick={() => router.push(PATHS.services)}>
            <Search className="h-4 w-4" />
            {t('browse_services')}
          </Button>
          {postProjectBtn}
        </div>
      </div>

      <ReferralBanner className="mb-1" />

      {!loading && deliveredForReview.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary-light)]/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[14px] font-medium text-[var(--kwork-text)]">{t('review_pending_banner')}</p>
          <Button variant="primary" size="sm" onClick={() => setReviewOrder(deliveredForReview[0])}>
            {t('leave_review')}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ShoppingBag} label={t('client_stat_total_orders')} value={metrics.totalOrders} loading={loading} />
        <StatCard icon={CheckCircle2} label={t('client_stat_completed')} value={metrics.completed} loading={loading} />
        <StatCard icon={Clock} label={t('client_stat_in_progress')} value={metrics.inProgress} loading={loading} />
        <StatCard icon={Wallet} label={t('client_stat_total_spent')} value={metrics.totalSpent} loading={loading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <DashboardPanel title={t('nav_orders')} action={postProjectBtn}>
          {loading ? (
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
                    className="w-full rounded-[var(--r-md)] border border-[var(--kwork-border)] p-3.5 text-left transition hover:border-[color-mix(in_srgb,var(--color-primary)_25%,var(--kwork-border))] hover:bg-[var(--neutral-50)]"
                  >
                    <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="truncate text-[14px] font-semibold text-[var(--kwork-text)]">
                          {order.services?.title ?? t('nav_orders')}
                        </h3>
                        <p className="mt-0.5 text-[12px] text-[var(--kwork-text-muted)]">
                          {order.freelancer_profile?.full_name ?? '—'} · {formatPrice(order.amount)}
                        </p>
                      </div>
                      <OrderStatusBadge status={order.status} />
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

        <DashboardPanel title={t('my_projects')} action={postProjectBtn}>
          {loading ? (
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
                    <h3 className="truncate text-[14px] font-semibold text-[var(--kwork-text)]">{p.title}</h3>
                    {p.region && (
                      <p className="mt-0.5 flex items-center gap-1 text-[12px] text-[var(--kwork-text-muted)]">
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
            </div>
          )}
        </DashboardPanel>
      </div>

      <DashboardPanel title={t('recent_activity')}>
        <ActivityTimeline />
      </DashboardPanel>

      <DashboardPanel title={t('recommended_freelancers')}>
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <SkeletonFreelancerCard key={i} />
            ))}
          </div>
        ) : freelancers.length === 0 ? (
          <EmptyState
            compact
            icon={<Search />}
            title={t('no_freelancers_yet')}
            description={t('kwork_freelancers_sub')}
            action={{ label: t('nav_freelancers'), onClick: () => router.push(PATHS.freelancers) }}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {freelancers.slice(0, 3).map((f) => (
              <FreelancerCard
                key={f.id}
                name={f.full_name ?? t('freelancer')}
                specialty={f.specialty}
                region={f.region}
                rating={f.avg_rating ?? 0}
                reviewCount={f.review_count ?? 0}
                variant="grid"
                onClick={() => router.push(freelancerPath(f.id))}
              />
            ))}
          </div>
        )}
      </DashboardPanel>

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
