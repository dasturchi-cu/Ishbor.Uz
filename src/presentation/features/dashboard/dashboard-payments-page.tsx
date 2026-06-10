'use client'

import { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { useDashboardRole } from '@/presentation/components/auth/role-guard'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { api } from '@/infrastructure/api/client'
import { formatPrice } from '@/shared/lib/format'
import { Receipt } from 'lucide-react'
import { PATHS } from '@/domain/constants/routes'
import { LoadErrorAlert } from '@/presentation/components/ui/load-error-alert'
import { formatDate } from '@/shared/lib/format-date'
import { transactionTypeLabel } from '@/shared/lib/transaction-label'
import { useProtectedLoader } from '@/shared/lib/use-protected-loader'

export function DashboardPaymentsPage() {
  const { t, language } = useApp()
  const router = useRouter()
  const role = useDashboardRole()
  const paymentsLive = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === 'true'

  const fetchPayments = useCallback(
    () =>
      Promise.all([api.listOrders(), api.listTransactions()]).then(([ord, tx]) => ({
        orders: ord,
        ledger: tx,
      })),
    []
  )

  const {
    data: paymentsData,
    loading,
    error: paymentsLoadError,
    loadError: paymentsFetchError,
    reload: loadPayments,
  } = useProtectedLoader(fetchPayments, [])
  const transactions = useMemo(() => {
    const orders = paymentsData?.orders ?? []
    const ledger = paymentsData?.ledger ?? []
    if (ledger.length > 0) {
      return ledger.map((tx) => ({
        id: tx.id,
        date: tx.created_at ? formatDate(tx.created_at, language) : '—',
        desc: transactionTypeLabel(tx.type, t),
        amount: tx.type === 'withdrawal' ? -tx.amount : tx.amount,
        status: tx.status === 'completed' ? 'completed' : 'pending',
      }))
    }
    return [...orders]
      .filter((o) => o.status !== 'cancelled')
      .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
      .map((o) => ({
        id: o.id,
        date: o.created_at ? formatDate(o.created_at, language) : '—',
        desc: o.services?.title ?? t('nav_orders'),
        amount: role === 'freelancer' ? o.amount : -o.amount,
        status: o.status === 'completed' ? 'completed' : 'pending',
      }))
  }, [paymentsData, role, t, language])

  return (
    <div className="space-y-5">
      {paymentsLoadError && (
        <LoadErrorAlert error={paymentsFetchError} scope="payments" onRetry={loadPayments} />
      )}
      <div className="rounded-xl border border-[var(--ishbor-border)] bg-[var(--neutral-0)] p-5">
        <h3 className="settings-section-title">{t('payments_methods_title')}</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {['Click', 'Payme'].map((method) => (
            <div key={method} className="flex items-center justify-between rounded-xl border border-dashed border-[var(--ishbor-border)] p-4">
              <span className="font-bold text-[var(--ishbor-text)]">{method}</span>
              <Button variant="outline" size="sm" disabled title={t('payment_connect_live_soon')}>
                {method === 'Click' ? t('connect_click') : t('connect_payme')}
              </Button>
            </div>
          ))}
        </div>
        {!paymentsLive && (
          <p className="mt-3 text-[12px] text-[var(--ishbor-text-muted)]">{t('payment_protected_note')}</p>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--ishbor-border)] bg-[var(--neutral-0)]">
        {loading ? (
          <div className="h-32 animate-pulse bg-[var(--color-bg-muted)]" />
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={<Receipt />}
            title={t('no_orders_yet')}
            description={t('payments_empty_desc')}
            action={{ label: t('nav_orders'), onClick: () => router.push(PATHS.dashboardOrders) }}
            secondaryAction={{
              label: t('nav_services'),
              onClick: () => router.push(PATHS.services),
              variant: 'outline',
            }}
          />
        ) : (
          <>
          <div className="show-mobile divide-y divide-[var(--ishbor-border)]">
            {transactions.map((tx) => (
              <div key={tx.id} className="px-4 py-3">
                <p className="text-[11px] text-[var(--ishbor-text-muted)]">{tx.date}</p>
                <p className="mt-1 text-[14px] font-medium text-[var(--ishbor-text)]">{tx.desc}</p>
                <div className="mt-2 flex items-center justify-between">
                  <p className={cnAmount(tx.amount)}>
                    {tx.amount < 0 ? '−' : '+'}
                    {formatPrice(Math.abs(tx.amount))}
                  </p>
                  <Badge variant={tx.status === 'pending' ? 'warning' : 'success'}>
                    {tx.status === 'pending' ? t('tab_in_progress') : t('tab_completed_orders')}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <table className="hide-mobile w-full text-left text-[13px]">
            <caption className="sr-only">{t('nav_payments')}</caption>
            <thead>
              <tr className="border-b border-[var(--ishbor-border)] text-[11px] font-semibold uppercase text-[var(--ishbor-text-muted)]">
                <th className="px-4 py-3">{t('date')}</th>
                <th className="px-4 py-3">{t('description')}</th>
                <th className="px-4 py-3">{t('amount')}</th>
                <th className="px-4 py-3">{t('status')}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-[var(--ishbor-border)] last:border-b-0">
                  <td className="px-4 py-3">{tx.date}</td>
                  <td className="px-4 py-3">{tx.desc}</td>
                  <td
                    className={cnAmount(tx.amount)}
                  >
                    {tx.amount < 0 ? '−' : '+'}
                    {formatPrice(Math.abs(tx.amount))}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={tx.status === 'pending' ? 'warning' : 'success'}>
                      {tx.status === 'pending' ? t('tab_in_progress') : t('tab_completed_orders')}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </>
        )}
      </div>
    </div>
  )
}

function cnAmount(amount: number): string {
  return amount < 0
    ? 'px-4 py-3 font-bold text-[var(--error)]'
    : 'px-4 py-3 font-bold text-[var(--success-dark)]'
}
