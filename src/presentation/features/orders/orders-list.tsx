'use client'

import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { Card } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Skeleton } from '@/presentation/components/ui/skeleton'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { OrderStatusBadge } from '@/presentation/components/features/order-status-badge'
import { PaymentStatusBadge } from '@/presentation/components/features/payment-status-badge'
import { OrderProgressStepper } from '@/presentation/components/features/order-progress-stepper'
import { LoadErrorAlert } from '@/presentation/components/ui/load-error-alert'
import { ShoppingBag } from 'lucide-react'
import { useOrdersQuery } from '@/shared/lib/use-orders-query'
import { formatPrice } from '@/shared/lib/format'
import { dashboardOrderPath, PATHS } from '@/domain/constants/routes'

type RoleView = 'freelancer' | 'client'

export function OrdersList({ role }: { role: RoleView }) {
  const { t, userId } = useApp()
  const router = useRouter()

  const {
    orders,
    loading,
    error: ordersLoadError,
    loadError: ordersError,
    reload: load,
  } = useOrdersQuery(Boolean(userId))
  const showLoadError = ordersLoadError

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-[var(--r-lg)]" />
        ))}
      </div>
    )
  }

  if (!showLoadError && orders.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag />}
        title={t('no_orders_yet')}
        description={t('no_orders_desc')}
        action={{
          label: role === 'freelancer' ? t('nav_services') : t('post_project'),
          onClick: () => router.push(role === 'freelancer' ? PATHS.services : PATHS.postProject),
        }}
        secondaryAction={
          role === 'client'
            ? { label: t('nav_services'), onClick: () => router.push(PATHS.services), variant: 'outline' }
            : undefined
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      {showLoadError && <LoadErrorAlert error={ordersError} scope="orders" onRetry={load} />}
      {orders.map((order) => {
        const title = order.services?.title ?? order.projects?.title ?? t('order_label')
        const counterparty =
          role === 'freelancer' ? order.client_profile?.full_name : order.freelancer_profile?.full_name

        return (
          <Card key={order.id} className="border border-border p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-[var(--color-text-sub)]">{counterparty ?? '—'}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <OrderStatusBadge status={order.status} />
                  <PaymentStatusBadge status={order.payment_status} />
                </div>
                <div className="mt-3">
                  <OrderProgressStepper status={order.status} paymentStatus={order.payment_status} />
                </div>
              </div>
              <div className="space-y-2 text-right">
                <p className="font-bold text-foreground">{formatPrice(order.amount)}</p>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`${PATHS.dashboardMessages}?order=${order.id}`)}
                  >
                    {t('nav_messages')}
                  </Button>
                  <Button size="sm" onClick={() => router.push(dashboardOrderPath(order.id))}>
                    {t('order_open_detail')}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
