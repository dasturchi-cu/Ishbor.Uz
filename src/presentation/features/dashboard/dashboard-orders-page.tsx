'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { useDashboardRole } from '@/presentation/components/auth/role-guard'
import { Input } from '@/presentation/components/ui/input'
import { Button } from '@/presentation/components/ui/button'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { Alert } from '@/presentation/components/ui/alert'
import { OrderStatusBadge } from '@/presentation/components/features/order-status-badge'
import { PaymentStatusBadge } from '@/presentation/components/features/payment-status-badge'
import { OrderProgressStepper } from '@/presentation/components/features/order-progress-stepper'
import { ReviewModal } from '@/presentation/components/features/review-modal'
import { Avatar } from '@/presentation/components/ui/avatar'
import { api } from '@/infrastructure/api/client'
import type { ApiOrder } from '@/infrastructure/api/types'
import { dashboardOrderPath, PATHS } from '@/domain/constants/routes'
import { formatPrice } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { ShoppingBag } from 'lucide-react'
import { toast } from '@/presentation/components/ui/toast'
import { formatDate } from '@/shared/lib/format-date'

const TABS = ['all', 'pending', 'active', 'delivered', 'disputed', 'completed', 'cancelled'] as const

export function DashboardOrdersPage() {
  const { t, language } = useApp()
  const router = useRouter()
  const role = useDashboardRole()
  const [tab, setTab] = useState<(typeof TABS)[number]>('all')
  const [search, setSearch] = useState('')
  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [reviewOrder, setReviewOrder] = useState<ApiOrder | null>(null)

  const loadOrders = () => {
    setLoading(true)
    setLoadError(false)
    api
      .listOrders()
      .then(setOrders)
      .catch(() => {
        setOrders([])
        setLoadError(true)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const filtered = orders.filter((o) => {
    if (tab !== 'all' && o.status !== tab) return false
    const title = o.services?.title?.toLowerCase() ?? ''
    const other =
      role === 'freelancer'
        ? o.client_profile?.full_name?.toLowerCase() ?? ''
        : o.freelancer_profile?.full_name?.toLowerCase() ?? ''
    if (search && !title.includes(search.toLowerCase()) && !other.includes(search.toLowerCase())) return false
    return true
  })

  const tabLabel: Record<(typeof TABS)[number], string> = {
    all: t('tab_all'),
    pending: t('tab_new_orders'),
    active: t('tab_in_progress'),
    delivered: t('tab_delivered'),
    disputed: t('disputed'),
    completed: t('tab_completed_orders'),
    cancelled: t('tab_cancelled_orders'),
  }

  const updateStatus = async (order: ApiOrder, status: string, openReview = false) => {
    try {
      const updated = await api.updateOrderStatus(order.id, status)
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)))
      if (openReview) setReviewOrder(updated)
    } catch {
      toast.error(t('error_order_update'))
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3 overflow-x-auto border-b border-[var(--kwork-border)] pb-1 sm:flex-wrap sm:border-b-0 sm:pb-0">
          {TABS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                'min-h-[44px] shrink-0 border-b-2 px-1 pb-2 pt-1 text-[13px] font-medium sm:min-h-0 sm:border-b-0 sm:rounded-lg sm:border sm:px-3 sm:py-1.5',
                tab === key
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)] sm:border-[var(--color-primary)] sm:bg-[var(--color-primary-light)]'
                  : 'border-transparent text-[var(--kwork-text-muted)] sm:border-[var(--kwork-border)]'
              )}
            >
              {tabLabel[key]}
            </button>
          ))}
        </div>
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('search_orders_ph')} className="max-w-xs" />
      </div>

      {loadError && (
        <Alert variant="error" className="mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{t('orders_load_failed')}</span>
            <Button variant="outline" size="sm" onClick={loadOrders}>
              {t('catalog_retry')}
            </Button>
          </div>
        </Alert>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-[var(--color-bg-muted)]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag />}
          title={orders.length > 0 ? t('no_orders_match') : t('no_orders_yet')}
          description={orders.length === 0 ? t('no_orders_desc') : undefined}
          action={
            orders.length === 0
              ? {
                  label: role === 'freelancer' ? t('btn_create_service') : t('post_project'),
                  onClick: () => router.push(role === 'freelancer' ? PATHS.createService : PATHS.postProject),
                }
              : undefined
          }
          secondaryAction={
            orders.length === 0
              ? {
                  label: t('nav_services'),
                  onClick: () => router.push(PATHS.services),
                  variant: 'outline',
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const otherName =
              role === 'freelancer'
                ? order.client_profile?.full_name ?? '—'
                : order.freelancer_profile?.full_name ?? '—'
            return (
              <div key={order.id} className="dashboard-order-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[12px] text-[var(--kwork-text-muted)]">
                      {t('order_number').replace('{n}', order.id.slice(0, 8))}
                      {order.created_at && ` · ${formatDate(order.created_at, language)}`}
                    </p>
                    <p className="mt-1 text-[14px] font-bold text-[var(--kwork-text)]">{order.services?.title ?? t('nav_orders')}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Avatar name={otherName} size={24} />
                      <span className="text-[13px]">{otherName}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <OrderStatusBadge status={order.status} />
                    <PaymentStatusBadge status={order.payment_status} />
                  </div>
                </div>
                <div className="mt-3">
                  <OrderProgressStepper status={order.status} paymentStatus={order.payment_status} />
                </div>
                {role === 'freelancer' && order.status === 'pending' && order.payment_status !== 'held' && (
                  <Alert variant="info" className="mt-3 text-[12px]">
                    {t('payment_waiting_freelancer')}
                  </Alert>
                )}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--kwork-border)] pt-3">
                  <p className="text-[14px] font-bold text-[var(--kwork-text)]">{formatPrice(order.amount)}</p>
                  <div className="flex gap-2">
                    <Link href={`${PATHS.dashboardMessages}?order=${order.id}`}>
                      <Button variant="outline" size="sm">{t('send_message')}</Button>
                    </Link>
                    {role === 'freelancer' && order.status === 'pending' && order.payment_status === 'held' && (
                      <Button variant="primary" size="sm" onClick={() => updateStatus(order, 'active')}>
                        {t('accept_order')}
                      </Button>
                    )}
                    {role === 'client' && order.status === 'pending' && order.payment_status !== 'held' && (
                      <Link href={dashboardOrderPath(order.id)}>
                        <Button variant="primary" size="sm">{t('payment_pay_now')}</Button>
                      </Link>
                    )}
                    {role === 'freelancer' && order.status === 'active' && (
                      <Link href={dashboardOrderPath(order.id)}>
                        <Button variant="primary" size="sm">{t('deliver_work')}</Button>
                      </Link>
                    )}
                    {role === 'client' && order.status === 'delivered' && (
                      <Button variant="primary" size="sm" onClick={() => updateStatus(order, 'completed', true)}>
                        {t('accept_work')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {reviewOrder && (
        <ReviewModal
          orderId={reviewOrder.id}
          serviceTitle={reviewOrder.services?.title}
          onClose={() => setReviewOrder(null)}
        />
      )}
    </div>
  )
}
