'use client'

import { useEffect, useMemo, useState } from 'react'
import { useProtectedLoader } from '@/shared/lib/use-protected-loader'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { OrderStatusBadge } from '@/presentation/components/features/order-status-badge'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { ArrowUpRight, ChevronRight, Lock, Receipt, Shield, TrendingUp, Wallet } from 'lucide-react'
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
import { dashboardPathForRole, PATHS } from '@/domain/constants/routes'
import { Breadcrumb } from '@/presentation/components/layout/breadcrumb'
import { Input } from '@/presentation/components/ui/input'
import { Button } from '@/presentation/components/ui/button'
import { Alert } from '@/presentation/components/ui/alert'
import { LoadErrorAlert } from '@/presentation/components/ui/load-error-alert'
import { toast } from '@/presentation/components/ui/toast'
import { captureActionError } from '@/shared/lib/action-error'
import { formatDate } from '@/shared/lib/format-date'
import { withdrawalSchema } from '@/domain/validators/withdrawal'
import { Skeleton } from '@/presentation/components/ui/skeleton'
import { transactionTypeLabel } from '@/shared/lib/transaction-label'
import { ReferralBanner } from '@/presentation/components/layout/referral-banner'
import { WalletTopupModal } from '@/presentation/features/wallet/wallet-topup-modal'
import { BankAccountsSection } from '@/presentation/features/wallet/bank-accounts-section'
import { useSearchParams } from 'next/navigation'
import {
  isWalletTopupComplete,
  isWalletTopupFailed,
  isWalletTopupIntentId,
  pollWalletTopupUntilDone,
} from '@/shared/lib/wallet-topup-poll'

const WITHDRAWAL_ERROR_KEYS = new Set<TranslationKey>([
  'withdrawal_bank_required',
  'withdrawal_bank_pending',
  'withdrawal_bank_not_found',
])

function resolveWithdrawalError(msg: string, t: (key: TranslationKey) => string): string {
  if (WITHDRAWAL_ERROR_KEYS.has(msg as TranslationKey)) return t(msg as TranslationKey)
  return msg || t('error_required')
}

export function WalletPage() {
  const { t, currentUserRole, language, profile, refreshProfile } = useApp()
  const pathname = usePathname()
  const router = useRouter()
  const inDashboard = pathname.startsWith('/dashboard')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawNote, setWithdrawNote] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  const [clientWithdrawHint, setClientWithdrawHint] = useState(false)
  const [partialLoadError, setPartialLoadError] = useState(false)
  const [topupOpen, setTopupOpen] = useState(false)
  const searchParams = useSearchParams()

  const {
    data: walletData,
    loading,
    error: loaderError,
    loadError: walletFetchError,
    reload: loadWallet,
  } = useProtectedLoader(async () => {
    setPartialLoadError(false)
    const [ord, ledgerRes, tx] = await Promise.all([
      api.listOrders().catch(() => {
        setPartialLoadError(true)
        return [] as ApiOrder[]
      }),
      api.listLedgerEntries(50).catch(() => {
        setPartialLoadError(true)
        return { items: [] as ApiLedgerEntry[] }
      }),
      api.listTransactions().catch(() => {
        setPartialLoadError(true)
        return [] as ApiTransaction[]
      }),
    ])
    await refreshProfile().catch(() => undefined)
    const withdrawals =
      currentUserRole === 'freelancer'
        ? await api.listWithdrawals().catch(() => [] as ApiWithdrawalRequest[])
        : ([] as ApiWithdrawalRequest[])
    const bankAccounts =
      currentUserRole === 'freelancer'
        ? await api.listBankAccounts().catch(() => [] as ApiBankAccount[])
        : ([] as ApiBankAccount[])
    return {
      orders: ord,
      ledgerEntries: ledgerRes.items ?? [],
      transactions: tx,
      withdrawals,
      bankAccounts,
    }
  }, [currentUserRole, refreshProfile])

  const withdrawals = walletData?.withdrawals ?? []
  const bankAccounts = walletData?.bankAccounts ?? []
  const hasVerifiedBank = bankAccounts.some((a) => a.is_verified)
  const hasPendingBank = bankAccounts.length > 0 && !hasVerifiedBank
  const loadError = partialLoadError || loaderError
  const walletError = loaderError ? walletFetchError : partialLoadError ? new Error('partial_wallet') : null

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
    ;(async () => {
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
        const msg = e instanceof Error ? e.message : ''
        toast.error(captureActionError(e, { scope: 'wallet_topup' }, t))
      } finally {
        if (!cancelled) router.replace(pathname)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [searchParams, t, loadWallet, refreshProfile, router, pathname])

  const { completed, active, pending, balance, activeCount } = useMemo(() => {
    const orders = walletData?.orders ?? []
    let completed = 0
    let active = 0
    let pending = 0
    let activeCount = 0
    for (const o of orders) {
      if (o.status === 'completed') completed += o.amount
      else if (o.status === 'active' || o.status === 'delivered') {
        active += o.amount
        activeCount += 1
      } else if (o.status === 'pending') {
        pending += o.amount
        activeCount += 1
      }
    }
    const computed =
      currentUserRole === 'freelancer' ? completed : completed + active + pending
    const dbBalance = profile?.wallet_balance
    const balance =
      currentUserRole === 'freelancer'
        ? dbBalance != null
          ? dbBalance
          : computed
        : dbBalance != null && dbBalance > 0
          ? dbBalance
          : computed
    return { completed, active, pending, balance, activeCount }
  }, [walletData, currentUserRole, profile?.wallet_balance])

  const recentTx = useMemo(() => {
    const orders = walletData?.orders ?? []
    const ledgerEntries = walletData?.ledgerEntries ?? []
    const ledger = walletData?.transactions ?? []
    if (ledgerEntries.length > 0) {
      return [...ledgerEntries]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 6)
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
        .slice(0, 6)
        .map((tx) => ({
          id: tx.id,
          label: transactionTypeLabel(tx.type, t),
          date: tx.created_at,
          amount: tx.type === 'withdrawal' ? -tx.amount : tx.amount,
          status: tx.status,
          fromLedger: false,
        }))
    }
    return [...orders]
      .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
      .slice(0, 6)
      .map((o) => ({
        id: o.id,
        label: o.services?.title ?? o.id.slice(0, 8),
        date: o.created_at,
        amount: o.amount,
        status: o.status,
        fromLedger: false,
      }))
  }, [walletData, t])

  const ordersHref = PATHS.dashboardOrders

  return (
    <div className="wallet-layout">
      <div className="wallet-intro">
        {!inDashboard && (
          <>
            <Breadcrumb
              className="mb-3"
              items={[
                { label: t('home'), href: PATHS.home },
                { label: t('nav_dashboard'), href: dashboardPathForRole(currentUserRole) },
                { label: t('wallet') },
              ]}
            />
            <h1 className="dashboard-page-title mb-2">{t('wallet')}</h1>
          </>
        )}
        <p className="wallet-intro-desc">{t('wallet_desc')}</p>
        {loadError && (
          <LoadErrorAlert
            error={walletError}
            scope="wallet"
            onRetry={() => void loadWallet()}
            className="mt-3"
          />
        )}
        <span className="wallet-intro-note">
          <Shield className="h-3 w-3" />
          {t('wallet_payment_note')}
        </span>
      </div>

      {currentUserRole === 'freelancer' && <ReferralBanner className="mb-4" />}

      <div className="wallet-balance-card">
        <div className="wallet-balance-top">
          <div>
            <p className="wallet-balance-label">
              <Wallet className="h-4 w-4" />
              {currentUserRole === 'client' ? t('client_wallet_spent') : t('available_balance')}
            </p>
            <p className="wallet-balance-value">
              {loading ? (
                <Skeleton className="h-9 w-36" />
              ) : (
                formatPrice(currentUserRole === 'client' ? completed : balance)
              )}
            </p>
            <div className="wallet-balance-escrow">
              <Shield className="h-3.5 w-3.5" />
              {t('escrow')} —{' '}
              {loading ? <Skeleton className="inline-block h-4 w-24 align-middle" /> : formatPrice(active + pending)}{' '}
              {currentUserRole === 'client' ? t('client_wallet_escrow_note') : t('protected_in_escrow')}
            </div>
          </div>
          <div className="wallet-balance-actions">
            {currentUserRole === 'client' && (
              <button type="button" className="wallet-balance-btn" onClick={() => setTopupOpen(true)}>
                {t('top_up')}
              </button>
            )}
            {currentUserRole === 'client' && (
              <Link href={PATHS.dashboardOrders} className="wallet-balance-btn">
                {t('payment_pay_now')}
              </Link>
            )}
            <button
              type="button"
              className="wallet-balance-btn wallet-balance-btn--primary"
              onClick={() => {
                if (currentUserRole !== 'freelancer') {
                  setClientWithdrawHint(true)
                  return
                }
                setClientWithdrawHint(false)
                if (!hasVerifiedBank) {
                  toast.error(
                    t(hasPendingBank ? 'withdrawal_bank_pending' : 'withdrawal_bank_required')
                  )
                  return
                }
                setWithdrawAmount(String(balance > 0 ? balance : ''))
              }}
            >
              {t('withdraw_funds')}
            </button>
          </div>
        </div>
      </div>

      {clientWithdrawHint && currentUserRole !== 'freelancer' && (
        <Alert variant="info" className="mb-4">
          {t('client_withdraw_unavailable')}
        </Alert>
      )}

      <div className="wallet-stats">
        <div className="wallet-stat">
          <div className="wallet-stat-icon">
            <TrendingUp />
          </div>
          <p className="wallet-stat-value">{loading ? '…' : formatPrice(completed)}</p>
          <p className="wallet-stat-label">{t('total_earnings')}</p>
        </div>
        <div className="wallet-stat">
          <div className="wallet-stat-icon">
            <Lock />
          </div>
          <div className="wallet-stat-value">
            {loading ? <Skeleton className="mx-auto h-7 w-28" /> : formatPrice(active + pending)}
          </div>
          <p className="wallet-stat-label">{t('escrow_balance')}</p>
          <p className="wallet-stat-hint">{t('protected_orders')}</p>
        </div>
        <div className="wallet-stat">
          <div className="wallet-stat-icon">
            <ArrowUpRight />
          </div>
          <p className="wallet-stat-value">
            {loading ? <Skeleton className="inline-block h-6 w-8" /> : String(activeCount)}
          </p>
          <p className="wallet-stat-label">{t('active_orders')}</p>
        </div>
      </div>

      {currentUserRole === 'freelancer' && (
        <div className="mb-5">
          <BankAccountsSection />
        </div>
      )}

      {currentUserRole === 'freelancer' && !hasVerifiedBank && (
        <Alert variant="info" className="mb-4">
          {t(hasPendingBank ? 'withdrawal_bank_pending' : 'withdrawal_bank_hint')}
        </Alert>
      )}

      {withdrawAmount !== '' && currentUserRole === 'freelancer' && (
        <section className="surface-panel mb-5 p-4">
          <h3 className="settings-section-title">{t('withdraw_funds')}</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => { setWithdrawAmount(''); setWithdrawNote('') }}>
              {t('cancel')}
            </Button>
            <Button
              variant="primary"
              loading={withdrawing}
              onClick={async () => {
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
                  toast.error(
                    t(hasPendingBank ? 'withdrawal_bank_pending' : 'withdrawal_bank_required')
                  )
                  return
                }
                setWithdrawing(true)
                try {
                  await api.requestWithdrawal(amount, withdrawNote.trim() || undefined)
                  toast.success(t('withdrawal_request_submitted'))
                  setWithdrawAmount('')
                  setWithdrawNote('')
                  await refreshProfile()
                  loadWallet()
                } catch (e) {
                  const raw = e instanceof Error ? e.message : ''
                  toast.error(resolveWithdrawalError(raw, t))
                } finally {
                  setWithdrawing(false)
                }
              }}
            >
              {t('withdraw_funds')}
            </Button>
          </div>
        </section>
      )}

      {currentUserRole === 'freelancer' && (
        <section className="surface-panel mb-5 p-4">
          <h3 className="settings-section-title">{t('withdrawal_pending_title')}</h3>
          {loading ? (
            <div className="mt-2 space-y-2">
              <Skeleton className="h-4 w-full max-w-md" />
              <Skeleton className="h-4 w-2/3 max-w-sm" />
            </div>
          ) : withdrawals.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--kwork-text-muted)]">{t('withdrawal_pending_empty')}</p>
          ) : (
            <div className="mt-3 space-y-2">
              {withdrawals.map((w) => (
                <div
                  key={w.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--kwork-border)] py-2 text-sm last:border-0"
                >
                  <div>
                    <p className="font-medium">{formatPrice(w.amount)}</p>
                    {w.note && <p className="text-[12px] text-[var(--kwork-text-muted)]">{w.note}</p>}
                    {w.created_at && (
                      <p className="text-[11px] text-[var(--kwork-text-muted)]">
                        {formatDate(w.created_at, language)}
                      </p>
                    )}
                  </div>
                  <span className="rounded-full bg-[var(--color-bg-muted)] px-2 py-0.5 text-[11px] font-semibold">
                    {w.status === 'pending'
                      ? t('withdrawal_status_pending')
                      : w.status === 'approved'
                        ? t('withdrawal_status_approved')
                        : t('withdrawal_status_rejected')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="wallet-tx-card">
        <div className="wallet-tx-header">
          <h2 className="wallet-tx-title">{t('transaction_history')}</h2>
          <Link href={ordersHref} className="wallet-tx-link">
            {t('view_all_orders')}
            <ChevronRight className="ml-0.5 inline h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="wallet-tx-list">
            {[0, 1, 2].map((i) => (
              <div key={i} className="px-4 py-3">
                <div className="h-4 w-40 animate-pulse rounded bg-[var(--color-bg-muted)]" />
                <div className="mt-2 h-3 w-24 animate-pulse rounded bg-[var(--color-bg-muted)]" />
              </div>
            ))}
          </div>
        ) : recentTx.length === 0 ? (
          <div className="p-4">
            <EmptyState
              compact
              icon={<Receipt />}
              title={t('no_orders_yet')}
              description={t('wallet_desc')}
              action={{ label: t('nav_orders'), onClick: () => router.push(ordersHref) }}
            />
          </div>
        ) : (
          <div className="wallet-tx-list">
            {recentTx.map((tx) => (
              <div key={tx.id} className="wallet-tx-row">
                <div className="wallet-tx-main">
                  <p className="wallet-tx-name">{tx.label}</p>
                  <div className="wallet-tx-meta flex flex-wrap items-center gap-1.5">
                    <span>{tx.date ? formatDate(tx.date, language) : '—'}</span>
                    {!tx.fromLedger && <OrderStatusBadge status={tx.status as ApiOrder['status']} />}
                  </div>
                </div>
                <p className="wallet-tx-amount">{formatPrice(Math.abs(tx.amount))}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <WalletTopupModal
        open={topupOpen}
        onClose={() => setTopupOpen(false)}
        onSuccess={() => void loadWallet()}
      />
    </div>
  )
}
