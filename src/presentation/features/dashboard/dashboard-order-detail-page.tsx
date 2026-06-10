'use client'

import { forwardRef, useEffect, useRef, useState, type ReactNode } from 'react'
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
import { formatPrice } from '@/shared/lib/format'
import { PaymentCheckoutFlow } from '@/presentation/components/features/payment-checkout-flow'
import { usePaymentCheckout } from '@/shared/lib/use-payment-checkout'
import type { Language, TranslationKey } from '@/infrastructure/i18n'
import { formatDate } from '@/shared/lib/format-date'
import { transactionTypeLabel } from '@/shared/lib/transaction-label'
import { toast } from '@/presentation/components/ui/toast'
import { ArrowLeft, MessageCircle, Shield, ShoppingBag } from 'lucide-react'
import { orderNextStepHintKey } from '@/shared/lib/order-next-step'
import { OrderReceiptCard } from '@/presentation/components/features/order-receipt-card'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { ignoreWithLog, loadOptional } from '@/shared/lib/ignore-with-log'
import { captureActionError } from '@/shared/lib/action-error'

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

type OrderRole = 'client' | 'freelancer'

function disputeStatusLabel(status: string, t: (key: TranslationKey) => string): string {
  const key = DISPUTE_STATUS_KEYS[status]
  return key ? t(key) : status
}

function packageLabelFor(order: ApiOrder, t: (key: TranslationKey) => string): string {
  if (order.package_id === 'premium') return t('package_premium')
  if (order.package_id === 'standard') return t('package_standard')
  return t('package_basic')
}

function OrderDetailSkeleton() {
  return (
    <div className="od-page">
      <div className="h-5 w-32 animate-pulse rounded bg-[var(--color-bg-muted)]" />
      <div className="mt-4 h-8 w-2/3 max-w-md animate-pulse rounded bg-[var(--color-bg-muted)]" />
      <div className="mt-2 h-4 w-40 animate-pulse rounded bg-[var(--color-bg-muted)]" />
      <div className="mt-6 h-14 animate-pulse rounded-xl bg-[var(--color-bg-muted)]" />
      <div className="od-grid mt-6">
        <div className="space-y-4">
          <div className="h-40 animate-pulse rounded-xl bg-[var(--color-bg-muted)]" />
          <div className="h-28 animate-pulse rounded-xl bg-[var(--color-bg-muted)]" />
        </div>
        <div className="hide-mobile h-64 animate-pulse rounded-xl bg-[var(--color-bg-muted)]" />
      </div>
    </div>
  )
}

function OrderDetailBack({ t }: { t: (key: TranslationKey) => string }) {
  return (
    <Link href={PATHS.dashboardOrders} className="od-back">
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {t('nav_orders')}
    </Link>
  )
}

function OrderDetailHeader({
  order,
  language,
  t,
}: {
  order: ApiOrder
  language: Language
  t: (key: TranslationKey) => string
}) {
  const serviceTitle = order.services?.title ?? t('nav_orders')

  return (
    <header className="od-header">
      <div className="od-header__main">
        <h1 className="od-header__title">{serviceTitle}</h1>
        <p className="od-header__meta">
          {t('order_number').replace('{n}', order.id.slice(0, 8))}
          {order.created_at ? ` · ${formatDate(order.created_at, language)}` : ''}
        </p>
      </div>
      <div className="od-header__badges">
        <OrderStatusBadge status={order.status} />
        <PaymentStatusBadge status={order.payment_status} />
      </div>
    </header>
  )
}

const OrderDetailFocus = forwardRef<
  HTMLElement,
  {
    id?: string
    headline: string
    amount?: string
    meta?: string
    children: ReactNode
    footer?: ReactNode
  }
>(function OrderDetailFocus({ id, headline, amount, meta, children, footer }, ref) {
  return (
    <section ref={ref} id={id} className="od-focus" aria-live="polite">
      <p className="od-focus__headline">{headline}</p>
      {amount ? <p className="od-focus__amount">{amount}</p> : null}
      {meta ? <p className="od-focus__meta">{meta}</p> : null}
      <div className="od-focus__body">{children}</div>
      {footer ? <div className="od-focus__footer">{footer}</div> : null}
    </section>
  )
})

function OrderDetailAside({
  order,
  role,
  otherName,
  packageLabel,
  transactions,
  orderDispute,
  t,
}: {
  order: ApiOrder
  role: OrderRole
  otherName: string
  packageLabel: string
  transactions: ApiTransaction[]
  orderDispute: ApiDispute | null
  t: (key: TranslationKey) => string
}) {
  const escrowNote =
    process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === 'true'
      ? t('commission_escrow_note')
      : t('payment_protected_note')

  return (
    <aside className="od-aside">
      <div className="od-aside-card">
        <p className="od-aside-label">{role === 'client' ? t('freelancer') : t('role_client_label')}</p>
        <div className="od-aside-person">
          <Avatar name={otherName} size={48} />
          <p className="od-aside-person__name">{otherName}</p>
        </div>
        <Link href={`${PATHS.dashboardMessages}?order=${order.id}`} className="mt-3 block">
          <Button variant="outline" fullWidth size="sm" leftIcon={<MessageCircle className="h-4 w-4" />}>
            {t('send_message')}
          </Button>
        </Link>
      </div>

      <div className="od-aside-card od-aside-card--summary">
        <p className="od-aside-label">{t('project_budget')}</p>
        <p className="od-aside-price">{formatPrice(order.amount)}</p>
        <p className="od-aside-meta">{packageLabel}</p>
        {order.payment_status === 'held' && (
          <p className="od-aside-escrow">
            <Shield className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {t('why_escrow')}
          </p>
        )}
      </div>

      {order.payment_status === 'held' && (
        <div className="od-aside-card od-aside-card--trust">
          <p className="od-aside-trust__title">{t('landing_buyer_protection')}</p>
          <p className="od-aside-trust__text">{escrowNote}</p>
          <Link href={PATHS.buyerProtection} className="od-aside-trust__link">
            {t('landing_buyer_protection')} →
          </Link>
        </div>
      )}

      {transactions.length > 0 && (
        <div className="od-aside-card">
          <p className="od-aside-label">{t('payment_timeline')}</p>
          <ul className="od-timeline">
            {transactions.map((tx) => (
              <li key={tx.id} className="od-timeline__row">
                <span>{transactionTypeLabel(tx.type, t)}</span>
                <span>{formatPrice(tx.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {order.status === 'disputed' && orderDispute && (
        <div className="od-aside-card">
          <p className="od-aside-label">{t('dispute_progress_label')}</p>
          <p className="text-[13px] font-medium text-[var(--ishbor-text)]">
            {disputeStatusLabel(orderDispute.status, t)}
          </p>
          <Link href={dashboardDispute(orderDispute.id)} className="od-aside-trust__link mt-2">
            {t('dispute_view_details')} →
          </Link>
        </div>
      )}

      {(order.payment_status === 'held' || order.payment_status === 'released') && role === 'client' && (
        <OrderReceiptCard orderId={order.id} />
      )}
    </aside>
  )
}

export function DashboardOrderDetailPage({ orderId }: { orderId: string }) {
  const { t, language, profile, refreshProfile } = useApp()
  const role = useDashboardRole()
  const router = useRouter()
  const focusRef = useRef<HTMLElement>(null)

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
  const [partialLoadError, setPartialLoadError] = useState(false)
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
    const ord = await api.getOrder(orderId)
    let partialFailed = false
    const txRes = await loadOptional(
      () => api.listOrderTransactions(orderId),
      [] as ApiTransaction[],
      { scope: 'payments', apiPath: `/api/v1/orders/${orderId}/transactions` }
    )
    partialFailed ||= txRes.failed
    let review: ApiReview | null = null
    if (ord.status === 'completed' && role === 'client') {
      const reviewRes = await loadOptional(
        () => api.getReviewForOrder(orderId),
        null,
        { scope: 'reviews', apiPath: `/api/v1/reviews/order/${orderId}` }
      )
      review = reviewRes.value
      partialFailed ||= reviewRes.failed
    }
    let dispute: ApiDispute | null = null
    if (ord.status === 'disputed') {
      const disputeRes = await loadOptional(
        () => api.getDisputeForOrder(orderId),
        null,
        { scope: 'orders', apiPath: `/api/v1/disputes/order/${orderId}` }
      )
      dispute = disputeRes.value
      partialFailed ||= disputeRes.failed
    }
    return {
      order: ord,
      transactions: txRes.value,
      orderReview: review,
      orderDispute: dispute,
      partialFailed,
    }
  }, [orderId, role])

  useEffect(() => {
    if (!orderData) return
    setOrder(orderData.order)
    setTransactions(orderData.transactions)
    setOrderReview(orderData.orderReview)
    setOrderDispute(orderData.orderDispute)
    setPartialLoadError(orderData.partialFailed)
  }, [orderData])

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
      const disputeRes = await loadOptional(
        () => api.getDisputeForOrder(order.id),
        null,
        { scope: 'orders', apiPath: `/api/v1/disputes/order/${order.id}` }
      )
      setOrderDispute(disputeRes.value)
      if (disputeRes.failed) setPartialLoadError(true)
      setDisputeOpen(false)
      setDisputeReason('')
      toast.success(t('dispute_opened'))
    } catch (e) {
      setError(captureActionError(e, { scope: 'generic', action: 'open_dispute' }, t))
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
    if (!order) return
    const nextStatus = NEXT_STATUS[role]?.[order.status]
    if (!nextStatus) return
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

  const scrollToFocus = () => {
    focusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (loading) {
    return <OrderDetailSkeleton />
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
      <div className="rounded-xl border border-[var(--ishbor-border)] bg-[var(--neutral-0)]">
        <EmptyState
          icon={<ShoppingBag />}
          title={t('order_not_found_title')}
          description={t('order_not_found_desc')}
          action={{ label: t('nav_orders'), onClick: () => router.push(PATHS.dashboardOrders) }}
        />
      </div>
    )
  }

  const otherName =
    role === 'freelancer'
      ? order.client_profile?.full_name ?? t('value_not_available')
      : order.freelancer_profile?.full_name ?? t('value_not_available')

  const packageLabel = packageLabelFor(order, t)
  const hintKey = orderNextStepHintKey(role, order.status, order.payment_status)
  const headline = hintKey ? t(hintKey) : t('nav_orders')
  const serviceTitle = order.services?.title ?? t('nav_orders')
  const amountLabel = formatPrice(order.amount)
  const metaLine = `${serviceTitle} · ${packageLabel}`

  const needsPayment =
    role === 'client' && order.status === 'pending' && order.payment_status !== 'held'
  const walletBalance = profile?.wallet_balance ?? 0
  const canPayFromWallet = needsPayment && walletBalance >= order.amount

  const actionKey = ACTION_LABEL[role]?.[order.status]
  const showStatusAction =
    Boolean(actionKey) &&
    !(role === 'freelancer' && order.status === 'active') &&
    !(role === 'freelancer' && order.status === 'pending' && order.payment_status !== 'held') &&
    !(role === 'client' && order.status === 'pending' && order.payment_status === 'held')

  const isDeliverPhase = role === 'freelancer' && order.status === 'active'
  const isWaitPaymentFreelancer =
    role === 'freelancer' && order.status === 'pending' && order.payment_status !== 'held'
  const showReviewCta = role === 'client' && order.status === 'completed' && !orderReview

  const renderFocusPrimary = (fullWidth: boolean) => {
    if (needsPayment) {
      if (canPayFromWallet) {
        return (
          <Button
            variant="primary"
            fullWidth={fullWidth}
            size="lg"
            loading={walletPaying}
            onClick={() => void handlePayFromWallet()}
          >
            {t('pay_from_wallet')} · {amountLabel}
          </Button>
        )
      }
      return (
        <PaymentCheckoutFlow
          phase={checkoutPhase}
          provider={checkoutProvider}
          isBusy={paying}
          amountLabel={amountLabel}
          onPay={handlePay}
          onRetry={retryCheckout}
        />
      )
    }

    if (isDeliverPhase) {
      return (
        <Button variant="primary" fullWidth={fullWidth} size="lg" loading={updating} onClick={() => void handleStatus()}>
          {t('mark_delivered')}
        </Button>
      )
    }

    if (showReviewCta) {
      return (
        <Button variant="primary" fullWidth={fullWidth} size="lg" onClick={() => setShowReview(true)}>
          {t('leave_review')}
        </Button>
      )
    }

    if (showStatusAction && actionKey) {
      return (
        <Button variant="primary" fullWidth={fullWidth} size="lg" loading={updating} onClick={() => void handleStatus()}>
          {t(actionKey)}
        </Button>
      )
    }

    return null
  }

  const focusPrimary = renderFocusPrimary(true)
  const showFocusCard =
    Boolean(focusPrimary) ||
    isWaitPaymentFreelancer ||
    needsPayment ||
    isDeliverPhase ||
    showReviewCta ||
    showStatusAction ||
    (Boolean(hintKey) && order.status === 'pending' && order.payment_status === 'held' && role === 'client')

  const renderMobilePrimary = () => {
    if (needsPayment && canPayFromWallet) {
      return (
        <Button variant="primary" className="flex-1" size="md" loading={walletPaying} onClick={() => void handlePayFromWallet()}>
          {t('payment_pay_now')}
        </Button>
      )
    }
    if (needsPayment) {
      return (
        <Button variant="primary" className="flex-1" size="md" onClick={scrollToFocus}>
          {t('payment_pay_now')}
        </Button>
      )
    }
    if (isDeliverPhase) {
      return (
        <Button variant="primary" className="flex-1" size="md" loading={updating} onClick={() => void handleStatus()}>
          {t('mark_delivered')}
        </Button>
      )
    }
    if (showReviewCta) {
      return (
        <Button variant="primary" className="flex-1" size="md" onClick={() => setShowReview(true)}>
          {t('leave_review')}
        </Button>
      )
    }
    if (showStatusAction && actionKey) {
      return (
        <Button variant="primary" className="flex-1" size="md" loading={updating} onClick={() => void handleStatus()}>
          {t(actionKey)}
        </Button>
      )
    }
    return null
  }

  const mobilePrimary = renderMobilePrimary()

  const focusFooter =
    needsPayment && !canPayFromWallet && walletBalance < order.amount ? (
      <p className="od-focus__wallet-hint">
        {t('payment_insufficient_balance')}{' '}
        <Link href={PATHS.dashboardWallet}>{t('nav_wallet')}</Link>
      </p>
    ) : role === 'client' && order.status === 'delivered' ? (
      <div className="od-focus__links">
        <button type="button" className="od-text-link" disabled={updating} onClick={() => void handleRequestRevision()}>
          {t('order_request_revision')}
        </button>
        <span className="od-focus__sep" aria-hidden>
          ·
        </span>
        <button type="button" className="od-text-link" onClick={() => setDisputeOpen(true)}>
          {t('open_dispute')}
        </button>
      </div>
    ) : role === 'client' && order.status === 'completed' && orderReview ? (
      <div className="od-focus__links">
        <button type="button" className="od-text-link" onClick={() => setShowReview(true)}>
          {t('review_edit')}
        </button>
        <span className="od-focus__sep" aria-hidden>
          ·
        </span>
        <button type="button" className="od-text-link" onClick={() => void handleDeleteReview()}>
          {t('review_delete')}
        </button>
      </div>
    ) : undefined

  return (
    <div className="od-page">
      <OrderDetailBack t={t} />
      <OrderDetailHeader order={order} language={language} t={t} />

      <div className="od-progress-wrap">
        <OrderProgressStepper status={order.status} paymentStatus={order.payment_status} />
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}
      {partialLoadError ? (
        <Alert variant="info">{t('error_section_partial')}</Alert>
      ) : null}

      <div className="od-grid">
        <div className="od-main">
          {showFocusCard ? (
            <OrderDetailFocus
              ref={focusRef}
              id="od-focus"
              headline={isWaitPaymentFreelancer ? t('payment_waiting_freelancer') : headline}
              amount={needsPayment || isDeliverPhase || showStatusAction || showReviewCta ? amountLabel : undefined}
              meta={needsPayment || isDeliverPhase ? metaLine : undefined}
              footer={focusFooter}
            >
              {isDeliverPhase ? (
                <Textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('deliver_notes_ph')}
                />
              ) : null}
              {focusPrimary}
            </OrderDetailFocus>
          ) : null}

          {(order.notes || order.delivery_notes) && (
            <section className="od-details">
              <h2 className="od-details__title">{t('order_notes_label')}</h2>
              {order.notes ? (
                <div className="od-details__block">
                  <p className="od-details__label">{t('project_description')}</p>
                  <p className="od-details__text">{order.notes}</p>
                </div>
              ) : null}
              {order.delivery_notes ? (
                <div className="od-details__block">
                  <p className="od-details__label">{t('deliver_work')}</p>
                  <p className="od-details__text">{order.delivery_notes}</p>
                </div>
              ) : null}
            </section>
          )}

          {order.status === 'disputed' && (
            <Alert variant="info">
              <p className="font-semibold">{t('disputed')}</p>
              {order.dispute_reason ? <p className="mt-1 text-[13px]">{order.dispute_reason}</p> : null}
              <p className="mt-2 text-[12px] text-[var(--ishbor-text-muted)]">{t('dispute_under_review')}</p>
            </Alert>
          )}
        </div>

        <OrderDetailAside
          order={order}
          role={role}
          otherName={otherName}
          packageLabel={packageLabel}
          transactions={transactions}
          orderDispute={orderDispute}
          t={t}
        />
      </div>

      {mobilePrimary ? (
        <div className="od-mobile show-mobile">
          <Link href={`${PATHS.dashboardMessages}?order=${order.id}`}>
            <Button variant="outline" size="md" className="od-mobile__msg" aria-label={t('send_message')}>
              <MessageCircle className="h-4 w-4" />
            </Button>
          </Link>
          {mobilePrimary}
        </div>
      ) : null}

      {disputeOpen ? (
        <div className="od-modal-backdrop" onClick={() => setDisputeOpen(false)}>
          <div
            ref={disputeDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dispute-modal-title"
            className="od-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="dispute-modal-title" className="od-modal__title">
              {t('open_dispute')}
            </h3>
            <p className="od-modal__desc">{t('dispute_reason_hint')}</p>
            <Textarea
              className="mt-3"
              rows={4}
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder={t('dispute_reason_ph')}
            />
            <div className="od-modal__actions">
              <Button variant="primary" loading={disputing} onClick={() => void handleDispute()}>
                {t('confirm')}
              </Button>
              <Button variant="outline" onClick={() => setDisputeOpen(false)}>
                {t('cancel')}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {showReview ? (
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
            void api
              .getReviewForOrder(order.id)
              .then(setOrderReview)
              .catch((e) => {
                ignoreWithLog(e, { scope: 'reviews', apiPath: `/api/v1/reviews/order/${order.id}` })
                setOrderReview(null)
              })
          }}
        />
      ) : null}
    </div>
  )
}
