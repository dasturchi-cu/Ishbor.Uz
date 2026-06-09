'use client'

import { useEffect, useRef, useState } from 'react'
import { useProtectedLoader } from '@/shared/lib/use-protected-loader'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { useDashboardRole } from '@/presentation/components/auth/role-guard'
import { Alert } from '@/presentation/components/ui/alert'
import { LoadErrorAlert } from '@/presentation/components/ui/load-error-alert'
import { Button } from '@/presentation/components/ui/button'
import { Textarea } from '@/presentation/components/ui/textarea'
import { OrderStatusBadge } from '@/presentation/components/features/order-status-badge'
import { PaymentStatusBadge } from '@/presentation/components/features/payment-status-badge'
import { OrderProgressStepper } from '@/presentation/components/features/order-progress-stepper'
import { ReviewModal } from '@/presentation/components/features/review-modal'
import { Avatar } from '@/presentation/components/ui/avatar'
import { api } from '@/infrastructure/api/client'
import type { ApiDispute, ApiOrder, ApiReview, ApiTransaction } from '@/infrastructure/api/types'
import { useFocusTrap } from '@/shared/lib/use-focus-trap'
import { useEscapeClose } from '@/shared/lib/use-escape-close'
import { dashboardDispute, PATHS } from '@/domain/constants/routes'
import {
  calcFreelancerPayout,
  calcPlatformFee,
  PLATFORM_COMMISSION_PERCENT,
} from '@/domain/constants/commission'
import { formatPrice } from '@/shared/lib/format'
import { PaymentCheckoutFlow } from '@/presentation/components/features/payment-checkout-flow'
import { usePaymentCheckout } from '@/shared/lib/use-payment-checkout'
import type { TranslationKey } from '@/infrastructure/i18n'
import { formatDate } from '@/shared/lib/format-date'
import { transactionTypeLabel } from '@/shared/lib/transaction-label'
import { toast } from '@/presentation/components/ui/toast'
import { ShoppingBag } from 'lucide-react'
import { OrderReceiptCard } from '@/presentation/components/features/order-receipt-card'
import { EmptyState } from '@/presentation/components/ui/empty-state'

const NEXT_STATUS: Record<string, Record<string, string>> = {
  freelancer: { pending: 'active', active: 'delivered' },
  client: { delivered: 'completed', pending: 'cancelled' },
}

const ACTION_LABEL: Record<string, Record<string, TranslationKey>> = {
  freelancer: { pending: 'accept_order', active: 'mark_delivered' },
  client: { delivered: 'accept_work', pending: 'cancel_order' },
}

const DISPUTE_STATUS_KEYS: Record<string, TranslationKey> = {
  open: 'dispute_status_open',
  responded: 'dispute_status_responded',
  under_review: 'dispute_status_under_review',
  resolved_client: 'dispute_status_resolved_client',
  resolved_freelancer: 'dispute_status_resolved_freelancer',
  closed: 'dispute_status_closed',
}

function disputeStatusLabel(status: string, t: (key: TranslationKey) => string): string {
  const key = DISPUTE_STATUS_KEYS[status]
  return key ? t(key) : status
}

export function DashboardOrderDetailPage({ orderId }: { orderId: string }) {
  const { t, language, profile, refreshProfile } = useApp()
  const role = useDashboardRole()
  const router = useRouter()
  const [order, setOrder] = useState<ApiOrder | null>(null)
  const [updating, setUpdating] = useState(false)
  const [walletPaying, setWalletPaying] = useState(false)
  const [error, setError] = useState('')
  const [showReview, setShowReview] = useState(false)
  const [notes, setNotes] = useState('')
  const [disputing, setDisputing] = useState(false)
  const [disputeOpen, setDisputeOpen] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [transactions, setTransactions] = useState<ApiTransaction[]>([])
  const [orderReview, setOrderReview] = useState<ApiReview | null>(null)
  const [orderDispute, setOrderDispute] = useState<ApiDispute | null>(null)
  const disputeDialogRef = useRef<HTMLDivElement>(null)

  useFocusTrap(disputeOpen, disputeDialogRef)
  useEscapeClose(disputeOpen, () => setDisputeOpen(false))

  const {
    data: orderData,
    loading,
    error: orderLoadFailed,
    loadError: orderFetchError,
    reload: reloadOrder,
  } = useProtectedLoader(async () => {
    const [ord, tx] = await Promise.all([
      api.getOrder(orderId).catch(() => null),
      api.listOrderTransactions(orderId).catch(() => [] as ApiTransaction[]),
    ])
    let review: ApiReview | null = null
    if (ord?.status === 'completed' && role === 'client') {
      review = await api.getReviewForOrder(orderId).catch(() => null)
    }
    let dispute: ApiDispute | null = null
    if (ord?.status === 'disputed') {
      dispute = await api.getDisputeForOrder(orderId).catch(() => null)
    }
    return { order: ord, transactions: tx, orderReview: review, orderDispute: dispute }
  }, [orderId, role])

  useEffect(() => {
    if (!orderData) return
    setOrder(orderData.order)
    setTransactions(orderData.transactions)
    setOrderReview(orderData.orderReview)
    setOrderDispute(orderData.orderDispute)
  }, [orderData])

  const otherName =
    role === 'freelancer'
      ? order?.client_profile?.full_name ?? t('value_not_available')
      : order?.freelancer_profile?.full_name ?? t('value_not_available')

  const nextStatus = order ? NEXT_STATUS[role]?.[order.status] : undefined
  const actionKey = order ? ACTION_LABEL[role]?.[order.status] : undefined

  const resolveCheckoutError = (msg: string) => {
    if (!msg) return ''
    return msg.startsWith('payment_') || msg.startsWith('error_')
      ? t(msg as TranslationKey)
      : msg
  }

  const { phase: checkoutPhase, provider: checkoutProvider, isBusy: paying, handlePay, retry: retryCheckout } =
    usePaymentCheckout({
      order,
      onOrderUpdate: setOrder,
      onError: (msg) => {
        const text = resolveCheckoutError(msg)
        setError(text)
        if (text) toast.error(text)
      },
      onSucceeded: () => toast.success(t('payment_success')),
    })

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
      const dispute = await api.getDisputeForOrder(order.id).catch(() => null)
      setOrderDispute(dispute)
      setDisputeOpen(false)
      setDisputeReason('')
      toast.success(t('dispute_opened'))
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error_required'))
    } finally {
      setDisputing(false)
    }
  }

  const handleDeleteReview = async () => {
    if (!orderReview) return
    if (!window.confirm(t('review_delete_confirm'))) return
    try {
      await api.deleteReview(orderReview.id)
      setOrderReview(null)
      toast.success(t('review_deleted'))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('error_required'))
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

  const handleRequestRevision = async () => {
    if (!order) return
    setUpdating(true)
    setError('')
    try {
      const updated = await api.updateOrderStatus(order.id, 'active')
      setOrder(updated)
      toast.success(t('order_revision_toast'))
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('error_required')
      setError(msg)
      toast.error(msg)
    } finally {
      setUpdating(false)
    }
  }

  const handlePayFromWallet = async () => {
    if (!order) return
    setWalletPaying(true)
    setError('')
    try {
      const result = await api.payOrderFromWallet(order.id)
      setOrder(result.order)
      void refreshProfile()
      toast.success(t('payment_success'))
    } catch (e) {
      const raw = e instanceof Error ? e.message : ''
      const text = resolveCheckoutError(raw)
      setError(text)
      if (text) toast.error(text)
    } finally {
      setWalletPaying(false)
    }
  }

  const walletBalance = profile?.wallet_balance ?? 0
  const canPayFromWallet =
    role === 'client' &&
    order != null &&
    order.status === 'pending' &&
    order.payment_status !== 'held' &&
    walletBalance >= order.amount

  if (loading) {
    return <div className="h-48 animate-pulse rounded-xl bg-[var(--color-bg-muted)]" />
  }

  if (orderLoadFailed && !order) {
    return (
      <LoadErrorAlert
        error={orderFetchError}
        scope="orders"
        onRetry={() => void reloadOrder()}
      />
    )
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
              <p className="text-[12px] font-medium text-[var(--kwork-text)]">
                {t('commission_rate').replace('{rate}', String(PLATFORM_COMMISSION_PERCENT))}
              </p>
              <p className="text-[11px] text-[var(--kwork-text-muted)]">
                {t('commission_fee_amount').replace('{amount}', formatPrice(calcPlatformFee(order.amount)))}
                {' · '}
                {t('commission_freelancer_net').replace('{amount}', formatPrice(calcFreelancerPayout(order.amount)))}
              </p>
              <p className="text-[11px] text-[var(--kwork-text-muted)]">{t('commission_escrow_note')}</p>
              <p className="text-[12px] text-[var(--kwork-text-muted)]">{t('payment_sandbox_note')}</p>
              {canPayFromWallet && (
                <div className="space-y-2 rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-primary-light)]/20 p-3">
                  <p className="text-[12px] text-[var(--kwork-text-muted)]">
                    {t('pay_from_wallet_hint')
                      .replace('{balance}', formatPrice(walletBalance))
                      .replace('{amount}', formatPrice(order.amount))}
                  </p>
                  <Button variant="primary" loading={walletPaying} onClick={() => void handlePayFromWallet()}>
                    {t('pay_from_wallet')}
                  </Button>
                </div>
              )}
              {role === 'client' &&
                order.status === 'pending' &&
                order.payment_status !== 'held' &&
                walletBalance < order.amount && (
                  <p className="text-[12px] text-[var(--kwork-text-muted)]">
                    {t('payment_insufficient_balance')}{' '}
                    <Link href={PATHS.dashboardWallet} className="font-medium text-primary hover:underline">
                      {t('nav_wallet')}
                    </Link>
                  </p>
                )}
              <PaymentCheckoutFlow
                phase={checkoutPhase}
                provider={checkoutProvider}
                isBusy={paying}
                amountLabel={formatPrice(order.amount)}
                onPay={handlePay}
                onRetry={retryCheckout}
              />
            </div>
          )}
        </div>

        {role === 'freelancer' && order.status === 'active' && (
          <div className="rounded-xl border border-[var(--kwork-border)] bg-[var(--neutral-0)] p-4">
            <h3 className="text-[14px] font-bold">{t('deliver_work')}</h3>
            <p className="mt-1 text-[12px] text-[var(--kwork-text-muted)]">{t('deliver_work_hint')}</p>
            <Textarea
              className="mt-3"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('deliver_notes_ph')}
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

        {order.status === 'disputed' && (
          <Alert variant="info">
            <p className="text-[13px] font-semibold">{t('disputed')}</p>
            {order.dispute_reason && <p className="mt-1 text-[13px]">{order.dispute_reason}</p>}
            {orderDispute && (
              <p className="mt-2 text-[12px] text-[var(--kwork-text-muted)]">
                {t('admin_dispute_status')}: {disputeStatusLabel(orderDispute.status, t)}
              </p>
            )}
            <p className="mt-1 text-[12px] text-[var(--kwork-text-muted)]">{t('dispute_under_review')}</p>
            {orderDispute && (
              <Link
                href={dashboardDispute(orderDispute.id)}
                className="mt-2 inline-block text-[13px] font-semibold text-[var(--color-primary)] hover:underline"
              >
                {t('dispute_view_details')} →
              </Link>
            )}
          </Alert>
        )}

        {role === 'client' && order.status === 'delivered' && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" loading={updating} onClick={handleRequestRevision}>
              {t('order_request_revision')}
            </Button>
            <Button variant="outline" onClick={() => setDisputeOpen(true)}>
              {t('open_dispute')}
            </Button>
          </div>
        )}

        {role === 'client' && order.status === 'completed' && (
          <div className="flex flex-wrap gap-2">
            {orderReview ? (
              <>
                <Button variant="outline" onClick={() => setShowReview(true)}>
                  {t('review_edit')}
                </Button>
                <Button variant="outline" onClick={handleDeleteReview}>
                  {t('review_delete')}
                </Button>
              </>
            ) : (
              <Button variant="primary" onClick={() => setShowReview(true)}>
                {t('leave_review')}
              </Button>
            )}
          </div>
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
            <p className="mt-2 text-[12px] leading-relaxed text-[var(--kwork-text-muted)]">
              {process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === 'true'
                ? t('commission_escrow_note')
                : t('payment_sandbox_note')}
            </p>
          </div>
        )}
        {(order.payment_status === 'held' || order.payment_status === 'released') && role === 'client' && (
          <OrderReceiptCard orderId={order.id} />
        )}
        <Button variant="outline" fullWidth onClick={() => router.push(PATHS.dashboardOrders)}>
          {t('back')}
        </Button>
      </aside>

      {showReview && (
        <ReviewModal
          orderId={order.id}
          serviceTitle={order.services?.title}
          existingReview={
            orderReview
              ? { id: orderReview.id, rating: orderReview.rating, comment: orderReview.comment }
              : undefined
          }
          onClose={() => setShowReview(false)}
          onSubmitted={() => {
            api.getReviewForOrder(order.id).then(setOrderReview).catch(() => setOrderReview(null))
          }}
        />
      )}
    </div>
  )
}
