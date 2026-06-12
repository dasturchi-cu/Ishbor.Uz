'use client'

import { useEffect, useMemo, useState } from 'react'
import { useProtectedLoader } from '@/shared/lib/use-protected-loader'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { OrderStatusBadge } from '@/presentation/components/features/order-status-badge'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { ArrowLeft, Receipt, Shield } from 'lucide-react'
import { api } from '@/infrastructure/api/client'
import type {
  ApiBankAccount,
  ApiLedgerEntry,
  ApiOrder,
  ApiTransaction,
  ApiWithdrawalRequest,
} from '@/infrastructure/api/types'
import type { TranslationKey } from '@/infrastructure/i18n'
import { formatPrice } from '@/shared/lib/format'
import { dashboardOrderPath, dashboardPathForRole, PATHS } from '@/domain/constants/routes'
import { Breadcrumb } from '@/presentation/components/layout/breadcrumb'
import { Input } from '@/presentation/components/ui/input'
import { Button } from '@/presentation/components/ui/button'
import { Alert } from '@/presentation/components/ui/alert'
import { LoadErrorAlert } from '@/presentation/components/ui/load-error-alert'
import { toast } from '@/presentation/components/ui/toast'
import { captureActionError } from '@/shared/lib/action-error'
import { ignoreWithLog } from '@/shared/lib/ignore-with-log'
import { formatDate } from '@/shared/lib/format-date'
import { withdrawalSchema } from '@/domain/validators/withdrawal'
import { Skeleton } from '@/presentation/components/ui/skeleton'
import { transactionTypeLabel } from '@/shared/lib/transaction-label'
import { WalletTopupModal } from '@/presentation/features/wallet/wallet-topup-modal'
import { BankAccountsSection } from '@/presentation/features/wallet/bank-accounts-section'
import {
  isWalletTopupComplete,
  isWalletTopupFailed,
  isWalletTopupIntentId,
  pollWalletTopupUntilDone,
} from '@/shared/lib/wallet-topup-poll'
import {
  ProductAsideCard,
  ProductBtn,
  ProductBtnLink,
  ProductFocus,
  ProductHero,
  ProductPage,
  ProductPageHeader,
  ProductPanel,
  ProductSplit,
  ProductTextLink,
  ProductTextLinkAnchor,
} from '@/presentation/components/product'

const WITHDRAWAL_ERROR_KEYS = new Set<TranslationKey>([
  'withdrawal_bank_required',
  'withdrawal_bank_pending',
  'withdrawal_bank_not_found',
])

type LedgerRow = {
  id: string
  label: string
  date: string | null | undefined
  amount: number
  status: string
  fromLedger: boolean
}

function resolveWithdrawalError(msg: string, t: (key: TranslationKey) => string): string {
  if (WITHDRAWAL_ERROR_KEYS.has(msg as TranslationKey)) return t(msg as TranslationKey)
  return msg || t('error_required')
}

function WalletSkeleton() {
  return (
    <ProductPage>
      <div className="h-8 w-48 animate-pulse rounded bg-[var(--color-bg-muted)]" />
      <ProductHero className="mt-5">
        <div className="h-4 w-32 animate-pulse rounded bg-[var(--color-bg-muted)]" />
        <div className="mt-3 h-10 w-40 animate-pulse rounded bg-[var(--color-bg-muted)]" />
      </ProductHero>
      <div className="ps-split mt-6">
        <div className="h-64 animate-pulse rounded-xl bg-[var(--color-bg-muted)]" />
        <div className="hide-mobile h-48 animate-pulse rounded-xl bg-[var(--color-bg-muted)]" />
      </div>
    </ProductPage>
  )
}

export function WalletPage() {
  const { t, currentUserRole, language, profile, refreshProfile } = useApp()
  const pathname = usePathname()
  const router = useRouter()
  const inDashboard = pathname.startsWith('/dashboard')
  const searchParams = useSearchParams()

  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawNote, setWithdrawNote] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  const [partialLoadError, setPartialLoadError] = useState(false)
  const [topupOpen, setTopupOpen] = useState(false)
  const [freelancerExtras, setFreelancerExtras] = useState<{
    withdrawals: ApiWithdrawalRequest[]
    bankAccounts: ApiBankAccount[]
  } | null>(null)

  const isClient = currentUserRole === 'client'
  const isFreelancer = currentUserRole === 'freelancer'
  const ordersHref = PATHS.dashboardOrders

  const {
    data: walletData,
    loading,
    error: loaderError,
    loadError: walletFetchError,
    reload: loadWallet,
  } = useProtectedLoader(async () => {
    setPartialLoadError(false)
    const [summary, ord] = await Promise.all([
      api.getWalletSummary().catch((e) => {
        ignoreWithLog(e, { scope: 'wallet', apiPath: '/api/v1/payments/wallet/summary' })
        setPartialLoadError(true)
        return {
          wallet_balance: profile?.wallet_balance ?? 0,
          recent_ledger: [] as ApiLedgerEntry[],
          recent_transactions_count: 0,
        }
      }),
      api.listOrders().catch((e) => {
        ignoreWithLog(e, { scope: 'orders', apiPath: '/api/v1/orders' })
        setPartialLoadError(true)
        return [] as ApiOrder[]
      }),
    ])
    return {
      orders: ord,
      ledgerEntries: summary.recent_ledger ?? [],
      transactions: [] as ApiTransaction[],
      walletBalance: summary.wallet_balance,
      withdrawals: [] as ApiWithdrawalRequest[],
      bankAccounts: [] as ApiBankAccount[],
    }
  }, [currentUserRole, profile?.wallet_balance])

  useEffect(() => {
    if (!isFreelancer) {
      setFreelancerExtras(null)
      return
    }
    let cancelled = false
    void (async () => {
      const [withdrawals, bankAccounts] = await Promise.all([
        api.listWithdrawals().catch((e) => {
          ignoreWithLog(e, { scope: 'wallet', apiPath: '/api/v1/withdrawals' })
          return [] as ApiWithdrawalRequest[]
        }),
        api.listBankAccounts().catch((e) => {
          ignoreWithLog(e, { scope: 'wallet', apiPath: '/api/v1/bank-accounts' })
          return [] as ApiBankAccount[]
        }),
      ])
      if (!cancelled) setFreelancerExtras({ withdrawals, bankAccounts })
    })()
    return () => {
      cancelled = true
    }
  }, [isFreelancer, walletData?.walletBalance])

  const withdrawals = freelancerExtras?.withdrawals ?? walletData?.withdrawals ?? []
  const bankAccounts = freelancerExtras?.bankAccounts ?? walletData?.bankAccounts ?? []
  const hasVerifiedBank = bankAccounts.some((a) => a.is_verified)
  const hasPendingBank = bankAccounts.length > 0 && !hasVerifiedBank

  useEffect(() => {
    const topup = searchParams.get('topup')
    if (!topup) return

    if (topup === 'success') {
      toast.success(t('wallet_topup_success'))
      void loadWallet()
      router.replace(pathname)
      return
    }

    if (!isWalletTopupIntentId(topup)) return

    let cancelled = false
    void (async () => {
      toast.info(t('wallet_topup_polling'))
      try {
        const result = await pollWalletTopupUntilDone(topup)
        if (cancelled) return
        if (isWalletTopupComplete(result.status)) {
          toast.success(t('wallet_topup_success'))
          await loadWallet()
          await refreshProfile()
        } else if (isWalletTopupFailed(result.status)) {
          toast.error(t('wallet_topup_failed'))
        } else {
          toast.error(t('wallet_topup_poll_timeout'))
        }
      } catch (e) {
        if (cancelled) return
        toast.error(captureActionError(e, { scope: 'wallet_topup' }, t))
      } finally {
        if (!cancelled) router.replace(pathname)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [searchParams, t, loadWallet, refreshProfile, router, pathname])

  const { active, pending, balance } = useMemo(() => {
    const orders = walletData?.orders ?? []
    let completedSum = 0
    let activeSum = 0
    let pendingSum = 0
    for (const o of orders) {
      if (o.status === 'completed') completedSum += o.amount
      else if (o.status === 'active' || o.status === 'delivered') activeSum += o.amount
      else if (o.status === 'pending') pendingSum += o.amount
    }
    const computed = isFreelancer ? completedSum : completedSum + activeSum + pendingSum
    const dbBalance = walletData?.walletBalance ?? profile?.wallet_balance
    const resolved =
      isFreelancer
        ? dbBalance != null
          ? dbBalance
          : computed
        : dbBalance != null && dbBalance > 0
          ? dbBalance
          : computed
    return { active: activeSum, pending: pendingSum, balance: resolved }
  }, [walletData, isFreelancer, profile?.wallet_balance])

  const displayBalance = walletData?.walletBalance ?? (isClient ? (profile?.wallet_balance ?? balance) : balance)
  const escrowTotal = active + pending

  const recentTx = useMemo((): LedgerRow[] => {
    const orders = walletData?.orders ?? []
    const ledgerEntries = walletData?.ledgerEntries ?? []
    const ledger = walletData?.transactions ?? []

    if (ledgerEntries.length > 0) {
      return [...ledgerEntries]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 12)
        .map((entry) => ({
          id: entry.id,
          label: entry.description?.trim() || entry.account_code,
          date: entry.created_at,
          amount: entry.entry_type === 'credit' ? entry.amount : -entry.amount,
          status: entry.entry_type,
          fromLedger: true,
        }))
    }

    if (ledger.length > 0) {
      return ledger
        .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
        .slice(0, 12)
        .map((tx) => ({
          id: tx.id,
          label: transactionTypeLabel(tx.type, t),
          date: tx.created_at,
          amount: tx.type === 'withdrawal' ? -tx.amount : tx.amount,
          status: tx.status ?? '',
          fromLedger: false,
        }))
    }

    return [...orders]
      .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
      .slice(0, 12)
      .map((o) => ({
        id: o.id,
        label: o.services?.title ?? o.id.slice(0, 8),
        date: o.created_at,
        amount: o.amount,
        status: o.status,
        fromLedger: false,
      }))
  }, [walletData, t])

  const protectedOrders = useMemo(() => {
    const orders = walletData?.orders ?? []
    return [...orders]
      .filter(
        (o) =>
          o.payment_status === 'held' ||
          (['pending', 'active', 'delivered'].includes(o.status) && o.payment_status !== 'released'),
      )
      .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
      .slice(0, 5)
  }, [walletData?.orders])

  const unpaidOrder = useMemo(() => {
    const orders = walletData?.orders ?? []
    return orders.find((o) => o.status === 'pending' && o.payment_status !== 'held')
  }, [walletData?.orders])

  useEffect(() => {
    if (searchParams.get('tab') !== 'protected') return
    document.getElementById('wl-protected')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [searchParams, loading])

  const openWithdraw = () => {
    if (!hasVerifiedBank) {
      toast.error(t(hasPendingBank ? 'withdrawal_bank_pending' : 'withdrawal_bank_required'))
      document.getElementById('wl-bank')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    setWithdrawAmount(balance > 0 ? String(balance) : '')
    setWithdrawNote('')
    setWithdrawOpen(true)
    requestAnimationFrame(() => {
      document.getElementById('wl-withdraw')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const submitWithdraw = async () => {
    const amount = parseInt(withdrawAmount, 10) || 0
    const parsed = withdrawalSchema.safeParse({
      amount,
      note: withdrawNote.trim() || undefined,
    })
    if (!parsed.success || amount > balance) {
      toast.error(t('error_required'))
      return
    }
    if (!hasVerifiedBank) {
      toast.error(t(hasPendingBank ? 'withdrawal_bank_pending' : 'withdrawal_bank_required'))
      return
    }
    setWithdrawing(true)
    try {
      await api.requestWithdrawal(amount, withdrawNote.trim() || undefined)
      toast.success(t('withdrawal_request_submitted'))
      setWithdrawOpen(false)
      setWithdrawAmount('')
      setWithdrawNote('')
      await refreshProfile()
      void loadWallet()
    } catch (e) {
      const raw = e instanceof Error ? e.message : ''
      toast.error(resolveWithdrawalError(raw, t))
    } finally {
      setWithdrawing(false)
    }
  }

  const heroActions = (
    <div className="ps-hero__actions">
      {isClient ? (
        unpaidOrder ? (
          <ProductTextLink onClick={() => setTopupOpen(true)}>{t('top_up')}</ProductTextLink>
        ) : (
          <>
            <ProductBtn onClick={() => setTopupOpen(true)}>{t('top_up')}</ProductBtn>
            <ProductTextLinkAnchor href={ordersHref}>{t('nav_orders')}</ProductTextLinkAnchor>
          </>
        )
      ) : withdrawOpen ? null : (
        <ProductBtn onClick={openWithdraw}>{t('withdraw_funds')}</ProductBtn>
      )}
    </div>
  )

  const mainContent = (
    <>
      {isClient && unpaidOrder && (
        <ProductFocus>
          <p className="ps-focus__headline">{t('order_hint_client_pay')}</p>
          <p className="ps-focus__amount">{formatPrice(unpaidOrder.amount)}</p>
          <p className="ps-focus__meta">
            {unpaidOrder.services?.title ?? unpaidOrder.projects?.title ?? t('order_label')}
          </p>
          <ProductBtnLink
            href={dashboardOrderPath(unpaidOrder.id)}
            className="mt-3.5 w-full text-center"
          >
            {t('payment_pay_now')}
          </ProductBtnLink>
        </ProductFocus>
      )}

      {isFreelancer && withdrawOpen && (
        <ProductFocus id="wl-withdraw">
          <p className="ps-focus__headline">{t('withdraw_funds')}</p>
          <p className="ps-focus__meta">
            {t('available_balance')}: {formatPrice(balance)}
          </p>
          <div className="wl-focus__form">
            <Input
              label={t('withdraw_amount_label')}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value.replace(/\D/g, ''))}
              placeholder={t('withdraw_amount_ph')}
            />
            <Input
              label={t('withdraw_note_label')}
              value={withdrawNote}
              onChange={(e) => setWithdrawNote(e.target.value)}
              placeholder={t('withdraw_note_ph')}
            />
          </div>
          <div className="wl-focus__actions">
            <Button variant="primary" size="lg" fullWidth loading={withdrawing} onClick={() => void submitWithdraw()}>
              {t('withdraw_funds')}
            </Button>
            <ProductTextLink
              onClick={() => {
                setWithdrawOpen(false)
                setWithdrawAmount('')
                setWithdrawNote('')
              }}
            >
              {t('cancel')}
            </ProductTextLink>
          </div>
        </ProductFocus>
      )}

      <ProductPanel
        title={t('transaction_history')}
        aria-label={t('transaction_history')}
        link={
          <Link href={ordersHref} className="ps-panel__link">
            {t('view_all_orders')}
            <ArrowLeft className="ps-icon ps-icon--sm ml-1 inline rotate-180" aria-hidden />
          </Link>
        }
      >
        {loading ? (
          <div className="ps-panel__list">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="ps-list-row">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : recentTx.length === 0 ? (
          <EmptyState
            compact
            icon={<Receipt />}
            title={t('no_orders_yet')}
            description={t('wallet_desc')}
            action={{ label: t('nav_orders'), onClick: () => router.push(ordersHref) }}
          />
        ) : (
          <ul className="ps-panel__list">
            {recentTx.map((tx) => (
              <li key={tx.id} className="ps-list-row">
                <div className="ps-list-row__main">
                  <p className="ps-list-row__label">{tx.label}</p>
                  <p className="ps-list-row__meta">
                    {tx.date ? formatDate(tx.date, language) : '—'}
                    {!tx.fromLedger && (
                      <>
                        {' · '}
                        <OrderStatusBadge status={tx.status as ApiOrder['status']} />
                      </>
                    )}
                  </p>
                </div>
                <span
                  className={
                    tx.amount < 0 ? 'ps-list-row__amount ps-list-row__amount--out' : 'ps-list-row__amount'
                  }
                >
                  {tx.amount < 0 ? '−' : '+'}
                  {formatPrice(Math.abs(tx.amount))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </ProductPanel>
    </>
  )

  const asideContent = (
    <>
      <ProductAsideCard
        id="wl-protected"
        title={t('wallet_protected_section_title')}
        icon={<Shield className="ps-icon text-[var(--color-primary)]" aria-hidden />}
      >
        <p className="ps-aside-card__desc">{t('wallet_protected_section_desc')}</p>
        {loading ? (
          <div className="mt-3 space-y-2">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        ) : protectedOrders.length === 0 ? (
          <p className="wl-aside-empty">{t('wallet_protected_empty_desc')}</p>
        ) : (
          <ul className="wl-protected-list">
            {protectedOrders.map((order) => (
              <li key={order.id}>
                <Link href={dashboardOrderPath(order.id)} className="wl-protected-item">
                  <div className="min-w-0">
                    <p className="wl-protected-item__title">
                      {order.services?.title ?? order.projects?.title ?? t('order_label')}
                    </p>
                    <p className="wl-protected-item__meta">{formatPrice(order.amount)}</p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
        {protectedOrders.length > 0 && (
          <Link href={`${ordersHref}?tab=protected`} className="ps-aside-card__link">
            {t('nav_orders')} →
          </Link>
        )}
      </ProductAsideCard>

      {isFreelancer && (
        <div id="wl-bank" className="ps-aside-card ps-aside-card--flat">
          {!hasVerifiedBank && (
            <Alert variant="info" className="mb-3">
              {t(hasPendingBank ? 'withdrawal_bank_pending' : 'withdrawal_bank_hint')}
            </Alert>
          )}
          <BankAccountsSection />
        </div>
      )}

      {isFreelancer && withdrawals.length > 0 && (
        <ProductAsideCard title={t('withdrawal_pending_title')}>
          <ul className="wl-withdraw-list">
            {withdrawals.map((w) => (
              <li key={w.id} className="wl-withdraw-item">
                <div>
                  <p className="wl-withdraw-item__amount">{formatPrice(w.amount)}</p>
                  {w.note ? <p className="wl-withdraw-item__note">{w.note}</p> : null}
                  {w.created_at ? (
                    <p className="wl-withdraw-item__date">{formatDate(w.created_at, language)}</p>
                  ) : null}
                </div>
                <span className="wl-withdraw-item__status">
                  {w.status === 'pending'
                    ? t('withdrawal_status_pending')
                    : w.status === 'approved'
                      ? t('withdrawal_status_approved')
                      : t('withdrawal_status_rejected')}
                </span>
              </li>
            ))}
          </ul>
        </ProductAsideCard>
      )}
    </>
  )

  if (loading && !walletData) {
    return <WalletSkeleton />
  }

  return (
    <ProductPage>
      {!inDashboard && (
        <Breadcrumb
          className="mb-3"
          items={[
            { label: t('home'), href: PATHS.home },
            { label: t('nav_dashboard'), href: dashboardPathForRole(currentUserRole) },
            { label: t('wallet') },
          ]}
        />
      )}

      <ProductPageHeader title={t('wallet')} description={t('wallet_desc')} />

      {loaderError && (
        <LoadErrorAlert
          error={walletFetchError}
          scope="wallet"
          onRetry={() => void loadWallet()}
          className="mt-4"
        />
      )}
      {partialLoadError && !loaderError && (
        <Alert variant="info" className="mt-4">
          {t('error_wallet_partial_load')}
        </Alert>
      )}

      <ProductHero aria-label={t('available_balance')}>
        <p className="ps-overline">{t('available_balance')}</p>
        <p className="ps-hero__amount">
          {loading ? <Skeleton className="inline-block h-10 w-44" /> : formatPrice(displayBalance)}
        </p>
        {escrowTotal > 0 || loading ? (
          <p className="ps-hero__meta">
            <Shield className="ps-icon ps-icon--sm" aria-hidden />
            {t('protected_payment_label')}:{' '}
            {loading ? <Skeleton className="inline-block h-4 w-24 align-middle" /> : formatPrice(escrowTotal)}
          </p>
        ) : null}
        {heroActions}
      </ProductHero>

      <ProductSplit main={mainContent} aside={asideContent} />

      <WalletTopupModal
        open={topupOpen}
        onClose={() => setTopupOpen(false)}
        onSuccess={() => void loadWallet()}
      />
    </ProductPage>
  )
}
