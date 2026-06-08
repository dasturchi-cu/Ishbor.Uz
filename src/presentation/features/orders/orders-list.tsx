'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { Card } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Textarea } from '@/presentation/components/ui/textarea'
import { Skeleton } from '@/presentation/components/ui/skeleton'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { OrderStatusBadge } from '@/presentation/components/features/order-status-badge'
import { PaymentStatusBadge } from '@/presentation/components/features/payment-status-badge'
import { Alert } from '@/presentation/components/ui/alert'
import { ShoppingBag } from 'lucide-react'
import { api } from '@/infrastructure/api/client'
import type { ApiOrder } from '@/infrastructure/api/types'
import { formatPrice, orderProgress } from '@/shared/lib/format'
import type { TranslationKey } from '@/infrastructure/i18n'
import { PATHS } from '@/domain/constants/routes'

type RoleView = 'freelancer' | 'client'

const NEXT_STATUS: Record<string, Record<string, string>> = {
  freelancer: {
    pending: 'active',
    active: 'delivered',
  },
  client: {
    delivered: 'completed',
    pending: 'cancelled',
  },
}

const ACTION_LABEL: Record<string, Record<string, TranslationKey>> = {
  freelancer: {
    pending: 'accept_order',
    active: 'mark_delivered',
  },
  client: {
    delivered: 'accept_work',
    pending: 'cancel_order',
  },
}

export function OrdersList({ role }: { role: RoleView }) {
  const { t, userId } = useApp()
  const router = useRouter()
  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [actionError, setActionError] = useState('')

  const load = () => {
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
    load()
  }, [])

  const updateStatus = async (orderId: string, status: string) => {
    setActionError('')
    try {
      await api.updateOrderStatus(orderId, status)
      load()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : t('error_required'))
    }
  }

  const submitReview = async () => {
    if (!reviewOrderId) return
    setActionError('')
    try {
      await api.createReview(reviewOrderId, rating, comment || undefined)
      setReviewOrderId(null)
      setComment('')
      load()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : t('error_required'))
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-[var(--r-lg)]" />
        ))}
      </div>
    )
  }

  if (!loadError && orders.length === 0) {
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
      {loadError && (
        <Alert variant="error">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{t('data_load_failed')}</span>
            <Button variant="outline" size="sm" onClick={load}>
              {t('catalog_retry')}
            </Button>
          </div>
        </Alert>
      )}
      {actionError && (
        <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">{actionError}</p>
      )}
      {orders.map((order) => {
        const title = order.services?.title ?? t('order_label')
        const counterparty =
          role === 'freelancer'
            ? order.client_profile?.full_name
            : order.freelancer_profile?.full_name
        const next = NEXT_STATUS[role]?.[order.status]
        const actionKey = ACTION_LABEL[role]?.[order.status]
        const canAccept =
          !(role === 'freelancer' && order.status === 'pending' && order.payment_status !== 'held')

        return (
          <Card key={order.id} className="p-4 border border-border">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-[var(--color-text-sub)]">
                  {counterparty ?? '—'}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <OrderStatusBadge status={order.status} />
                  <PaymentStatusBadge status={order.payment_status} />
                </div>
                {role === 'freelancer' && order.status === 'pending' && order.payment_status !== 'held' && (
                  <Alert variant="info" className="mt-2 text-[12px]">
                    {t('payment_waiting_freelancer')}
                  </Alert>
                )}
                <div className="mt-2 h-2 w-full max-w-xs rounded-full bg-[var(--color-bg-muted)]">
                  <div
                    className="h-2 rounded-full bg-[var(--color-primary)]"
                    style={{ width: `${orderProgress(order.status)}%` }}
                  />
                </div>
              </div>
              <div className="text-right space-y-2">
                <p className="font-bold text-foreground">{formatPrice(order.amount)}</p>
                <div className="flex flex-wrap gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={() => router.push(`${PATHS.messages}?order=${order.id}`)}>
                    {t('nav_messages')}
                  </Button>
                  {next && actionKey && canAccept && (
                    <Button size="sm" onClick={() => updateStatus(order.id, next)}>
                      {t(actionKey)}
                    </Button>
                  )}
                  {role === 'client' && order.status === 'completed' && userId === order.client_id && (
                    <Button size="sm" variant="secondary" onClick={() => setReviewOrderId(order.id)}>
                      {t('leave_review')}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )
      })}

      {reviewOrderId && (
        <Card className="p-6 space-y-4 border-primary/30">
          <h3 className="font-bold">{t('leave_review')}</h3>
          <div>
            <label className="text-sm font-medium block mb-1">{t('rating')}</label>
            <Input
              type="number"
              min={1}
              max={5}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            />
          </div>
          <Textarea
            label={t('review_comment')}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={submitReview}>{t('submit_review')}</Button>
            <Button variant="outline" onClick={() => setReviewOrderId(null)}>{t('back')}</Button>
          </div>
        </Card>
      )}
    </div>
  )
}
