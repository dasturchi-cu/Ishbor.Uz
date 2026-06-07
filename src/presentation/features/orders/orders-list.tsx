'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { Card } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { api } from '@/infrastructure/api/client'
import type { ApiOrder } from '@/infrastructure/api/types'
import { formatPrice, orderProgress, orderStatusLabel } from '@/shared/lib/format'
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
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [actionError, setActionError] = useState('')

  const load = () => {
    setLoading(true)
    api
      .listOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
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
    return <p className="text-muted-foreground text-sm">{t('loading_data')}</p>
  }

  if (orders.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        {t('no_orders_yet')}
      </Card>
    )
  }

  return (
    <div className="space-y-4">
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

        return (
          <Card key={order.id} className="p-4 border border-border">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">
                  {counterparty ?? '—'} · {orderStatusLabel(order.status, t)}
                </p>
                <div className="w-full max-w-xs bg-secondary rounded-full h-2 mt-2">
                  <div
                    className="bg-primary h-2 rounded-full"
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
                  {next && actionKey && (
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
          <div>
            <label className="text-sm font-medium block mb-1">{t('review_comment')}</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background min-h-20"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={submitReview}>{t('submit_review')}</Button>
            <Button variant="outline" onClick={() => setReviewOrderId(null)}>{t('cancel')}</Button>
          </div>
        </Card>
      )}
    </div>
  )
}
