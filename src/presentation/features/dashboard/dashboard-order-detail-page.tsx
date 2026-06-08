'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { useDashboardRole } from '@/presentation/components/auth/role-guard'
import { Alert } from '@/presentation/components/ui/alert'
import { Button } from '@/presentation/components/ui/button'
import { Textarea } from '@/presentation/components/ui/textarea'
import { OrderStatusBadge } from '@/presentation/components/features/order-status-badge'
import { PaymentStatusBadge } from '@/presentation/components/features/payment-status-badge'
import { OrderProgressStepper } from '@/presentation/components/features/order-progress-stepper'
import { ReviewModal } from '@/presentation/components/features/review-modal'
import { Avatar } from '@/presentation/components/ui/avatar'
import { api, ApiError } from '@/infrastructure/api/client'
import type { ApiOrder, ApiTransaction } from '@/infrastructure/api/types'
import { useFocusTrap } from '@/shared/lib/use-focus-trap'
import { useEscapeClose } from '@/shared/lib/use-escape-close'
import { PATHS } from '@/domain/constants/routes'
import { formatPrice } from '@/shared/lib/format'
import type { TranslationKey } from '@/infrastructure/i18n'
import { formatDate } from '@/shared/lib/format-date'
import { transactionTypeLabel } from '@/shared/lib/transaction-label'
import { toast } from '@/presentation/components/ui/toast'
import { CreditCard, ShoppingBag } from 'lucide-react'
import { EmptyState } from '@/presentation/components/ui/empty-state'

const NEXT_STATUS: Record<string, Record<string, string>> = {
  freelancer: { pending: 'active', active: 'delivered' },
  client: { delivered: 'completed', pending: 'cancelled' },
}

const ACTION_LABEL: Record<string, Record<string, TranslationKey>> = {
  freelancer: { pending: 'accept_order', active: 'mark_delivered' },
  client: { delivered: 'accept_work', pending: 'cancel_order' },
}

export function DashboardOrderDetailPage({ orderId }: { orderId: string }) {
  const { t, language } = useApp()
  const role = useDashboardRole()
  const router = useRouter()
  const [order, setOrder] = useState<ApiOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const [showReview, setShowReview] = useState(false)
  const [notes, setNotes] = useState('')
  const [paying, setPaying] = useState(false)
  const [disputing, setDisputing] = useState(false)
  const [disputeOpen, setDisputeOpen] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [transactions, setTransactions] = useState<ApiTransaction[]>([])
  const disputeDialogRef = useRef<HTMLDivElement>(null)

  useFocusTrap(disputeOpen, disputeDialogRef)
  useEscapeClose(disputeOpen, () => setDisputeOpen(false))

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.getOrder(orderId).catch(() => null),
      api.listOrderTransactions(orderId).catch(() => [] as ApiTransaction[]),
    ])
      .then(([ord, tx]) => {
        setOrder(ord)
        setTransactions(tx)
      })
      .finally(() => setLoading(false))
  }, [orderId])

  const otherName =
    role === 'freelancer'
      ? order?.client_profile?.full_name ?? t('value_not_available')
      : order?.freelancer_profile?.full_name ?? t('value_not_available')

  const nextStatus = order ? NEXT_STATUS[role]?.[order.status] : undefined
  const actionKey = order ? ACTION_LABEL[role]?.[order.status] : undefined

  const handlePay = async (provider: 'sandbox' | 'click' | 'payme' = 'sandbox') => {
    if (!order) return
    setPaying(true)
    setError('')
    try {
      const updated = await api.checkoutOrder(order.id, provider)
      setOrder(updated)
      toast.success(t('payment_success'))
    } catch (e) {
      if (e instanceof ApiError && e.status === 501 && provider !== 'sandbox') {
        try {
          const updated = await api.checkoutOrder(order.id, 'sandbox')
          setOrder(updated)
          toast.info(t('payment_fallback_sandbox'))
          return
        } catch (fallbackErr) {
          const msg = fallbackErr instanceof Error ? fallbackErr.message : t('error_required')
          setError(msg)
          toast.error(msg)
          return
        }
      }
      const msg = e instanceof Error ? e.message : t('error_required')
      setError(msg)
      toast.error(msg)
    } finally {
      setPaying(false)
    }
  }

  const handleDispute = async () => {
    if (!order) return
    const reason = disputeReason.trim()
    if (reason.length < 10) {
      setError(t('dispute_reason_required'))
      return
    }
    setDisputing(true)
    setError('')
    try {
      const updated = await api.updateOrderStatus(order.id, 'disputed', { disputeReason: reason })
      setOrder(updated)
      setDisputeOpen(false)
      setDisputeReason('')
      toast.success(t('dispute_opened'))
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error_required'))
    } finally {
      setDisputing(false)
    }
  }

  const handleStatus = async () => {
    if (!order || !nextStatus) return
    setUpdating(true)
    setError('')
    try {
      const deliveryPayload =
        role === 'freelancer' && nextStatus === 'delivered' && notes.trim()
          ? notes.trim()
          : undefined
      const updated = await api.updateOrderStatus(order.id, nextStatus, {
        deliveryNotes: deliveryPayload,
      })
      setOrder(updated)
      if (nextStatus === 'completed' && role === 'client') {
        setShowReview(true)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error_required'))
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return <div className="h-48 animate-pulse rounded-xl bg-[var(--color-bg-muted)]" />
  }

  if (!order) {
    return (
      <div className="rounded-xl border border-[var(--kwork-border)] bg-[var(--neutral-0)]">
        <EmptyState
          icon={<ShoppingBag />}
          title={t('order_not_found_title')}
          description={t('order_not_found_desc')}
          action={{ label: t('nav_orders'), onClick: () => router.push(PATHS.dashboardOrders) }}
        />
      </div>
    )
  }

  const packageLabel =
    order.package_id === 'premium'
      ? t('package_premium')
      : order.package_id === 'standard'
        ? t('package_standard')
        : t('package_basic')

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="dashboard-page-title">{t('order_number').replace('{n}', order.id.slice(0, 8))}</h2>
            <p className="text-[13px] text-[var(--kwork-text-muted)]">
              {order.created_at && formatDate(order.created_at, language)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.payment_status} />
          </div>
        </div>

        <OrderProgressStepper status={order.status} paymentStatus={order.payment_status} />

        {role === 'client' && order.status === 'pending' && order.payment_status !== 'held' && (
          <Alert variant="info">{t('first_order_promo')}</Alert>
        )}

        {error && <Alert variant="error">{error}</Alert>}

        <div className="rounded-xl border border-[var(--kwork-border)] bg-[var(--neutral-0)] p-4">
          <p className="font-bold text-[var(--kwork-text)]">{order.services?.title ?? t('nav_orders')}</p>
          <p className="mt-2 text-[14px] font-semibold">{formatPrice(order.amount)}</p>
          <p className="mt-1 text-[12px] text-[var(--kwork-text-muted)]">{packageLabel}</p>
          {order.notes && (
            <p className="mt-2 text-[13px] text-[var(--kwork-text-muted)]">
              <span className="font-semibold text-[var(--kwork-text)]">{t('order_notes_label')}: </span>
              {order.notes}
            </p>
          )}
          {order.delivery_notes && (
            <p className="mt-2 text-[13px] text-[var(--kwork-text-muted)]">
              <span className="font-semibold text-[var(--kwork-text)]">{t('deliver_work')}: </span>
              {order.delivery_notes}
            </p>
          )}
          {role === 'client' && order.status === 'pending' && order.payment_status !== 'held' && (
            <div className="mt-4 space-y-2 border-t border-[var(--kwork-border)] pt-4">
              <p className="text-[13px] text-[var(--kwork-text-muted)]">{t('payment_required_hint')}</p>
              <p className="text-[12px] font-medium text-[var(--kwork-text)]">{t('commission_zero')}</p>
              <p className="text-[11px] text-[var(--kwork-text-muted)]">{t('landing_stat_commission_note')}</p>
              <p className="text-[12px] text-[var(--kwork-text-muted)]">{t('payment_sandbox_note')}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" loading={paying} onClick={() => handlePay('sandbox')} className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  {t('payment_pay_now')}
                </Button>
                <Button variant="outline" disabled title={t('payment_click_soon')}>
                  Click
                </Button>
                <Button variant="outline" disabled title={t('payment_payme_soon')}>
                  Payme
                </Button>
              </div>
              <p className="text-[11px] text-[var(--kwork-text-muted)]">{t('payment_provider_sandbox')}</p>
            </div>
          )}
        </div>

        {role === 'freelancer' && order.status === 'active' && (
          <div className="rounded-xl border border-[var(--kwork-border)] bg-[var(--neutral-0)] p-4">
            <h3 className="text-[14px] font-bold">{t('deliver_work')}</h3>
            <Textarea
              className="mt-3"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('type_message_ph')}
            />
            <Button variant="primary" className="mt-4" loading={updating} onClick={handleStatus}>
              {t('mark_delivered')}
            </Button>
          </div>
        )}

        {role === 'freelancer' && order.status === 'pending' && order.payment_status !== 'held' && (
          <Alert variant="info">{t('payment_waiting_freelancer')}</Alert>
        )}

        {actionKey &&
          !(role === 'freelancer' && order.status === 'active') &&
          !(role === 'freelancer' && order.status === 'pending' && order.payment_status !== 'held') && (
          <Button variant="primary" loading={updating} onClick={handleStatus}>
            {t(actionKey)}
          </Button>
        )}

        {order.status === 'disputed' && order.dispute_reason && (
          <Alert variant="info">
            <p className="text-[13px] font-semibold">{t('disputed')}</p>
            <p className="mt-1 text-[13px]">{order.dispute_reason}</p>
          </Alert>
        )}

        {role === 'client' && order.status === 'delivered' && (
          <Button variant="outline" onClick={() => setDisputeOpen(true)}>
            {t('open_dispute')}
          </Button>
        )}

        {disputeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDisputeOpen(false)}>
            <div
              ref={disputeDialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="dispute-modal-title"
              className="w-full max-w-md rounded-xl border border-[var(--kwork-border)] bg-[var(--neutral-0)] p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 id="dispute-modal-title" className="text-[16px] font-bold">{t('open_dispute')}</h3>
              <p className="mt-1 text-[13px] text-[var(--kwork-text-muted)]">{t('dispute_reason_hint')}</p>
              <Textarea
                className="mt-3"
                rows={4}
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder={t('dispute_reason_ph')}
              />
              <div className="mt-4 flex gap-2">
                <Button variant="primary" loading={disputing} onClick={handleDispute}>
                  {t('confirm')}
                </Button>
                <Button variant="outline" onClick={() => setDisputeOpen(false)}>
                  {t('cancel')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <div className="rounded-xl border border-[var(--kwork-border)] bg-[var(--neutral-0)] p-4">
          <div className="flex items-center gap-3">
            <Avatar name={otherName} size={40} />
            <div>
              <p className="font-bold">{otherName}</p>
            </div>
          </div>
          <Link href={`${PATHS.dashboardMessages}?order=${order.id}`}>
            <Button variant="outline" fullWidth className="mt-4">
              {t('send_message')}
            </Button>
          </Link>
        </div>
        {transactions.length > 0 && (
          <div className="rounded-xl border border-[var(--kwork-border)] bg-[var(--neutral-0)] p-4">
            <p className="text-[13px] font-bold text-[var(--kwork-text)]">{t('payment_timeline')}</p>
            <ul className="mt-3 space-y-2">
              {transactions.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between gap-2 text-[12px]">
                  <span className="text-[var(--kwork-text-muted)]">
                    {transactionTypeLabel(tx.type, t)}
                  </span>
                  <span className="font-semibold">{formatPrice(tx.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {order.payment_status === 'held' && (
          <div className="rounded-xl border border-[var(--kwork-border)] bg-[var(--color-primary-light)]/30 p-4">
            <p className="text-[13px] font-bold text-[var(--kwork-text)]">{t('why_escrow')}</p>
            <p className="mt-2 text-[12px] leading-relaxed text-[var(--kwork-text-muted)]">{t('payment_sandbox_note')}</p>
          </div>
        )}
        <Button variant="outline" fullWidth onClick={() => router.push(PATHS.dashboardOrders)}>
          {t('back')}
        </Button>
      </aside>

      {showReview && (
        <ReviewModal
          orderId={order.id}
          serviceTitle={order.services?.title}
          onClose={() => setShowReview(false)}
        />
      )}
    </div>
  )
}
