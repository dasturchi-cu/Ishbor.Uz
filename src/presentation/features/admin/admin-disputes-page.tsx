'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useApp } from '@/application/providers/app-provider'
import { Card } from '@/presentation/components/ui/card'
import { Alert } from '@/presentation/components/ui/alert'
import { Button } from '@/presentation/components/ui/button'
import { LoadingBlock } from '@/presentation/components/ui/loading-block'
import { ConfirmModal } from '@/presentation/components/dashboard/confirm-modal'
import { api } from '@/infrastructure/api/client'
import type { ApiDispute, ApiOrder } from '@/infrastructure/api/types'
import { formatPrice } from '@/shared/lib/format'
import { PaymentStatusBadge } from '@/presentation/components/features/payment-status-badge'
import { OrderStatusBadge } from '@/presentation/components/features/order-status-badge'
import { AdminLayout } from '@/presentation/features/admin/admin-layout'
import { AdminTabs } from '@/presentation/features/admin/admin-tabs'
import { dashboardContract } from '@/domain/constants/routes'

type DisputeTab = 'all' | 'orders' | 'contracts' | 'resolved'
type DisputeScope = 'open' | 'resolved' | 'all'

interface PendingAction {
  type: 'order' | 'contract'
  id: string
  resolution: string
  label: string
}

export function AdminDisputesPage() {
  const { t } = useApp()
  const [tab, setTab] = useState<DisputeTab>('all')
  const [orderDisputes, setOrderDisputes] = useState<ApiOrder[]>([])
  const [contractDisputes, setContractDisputes] = useState<ApiDispute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingAction | null>(null)

  const scope: DisputeScope = tab === 'resolved' ? 'resolved' : 'open'

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const loadOrders = tab === 'all' || tab === 'orders' || tab === 'resolved'
      const loadContracts = tab === 'all' || tab === 'contracts' || tab === 'resolved'
      const [ordersRes, contractsRes] = await Promise.all([
        loadOrders ? api.adminDisputes({ limit: 50, scope }) : Promise.resolve({ items: [], total: 0 }),
        loadContracts ? api.adminContractDisputes({ limit: 50, scope }) : Promise.resolve({ items: [], total: 0 }),
      ])
      setOrderDisputes(ordersRes.items)
      setContractDisputes(contractsRes.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('data_load_failed'))
    } finally {
      setLoading(false)
    }
  }, [scope, tab, t])

  useEffect(() => {
    load()
  }, [load])

  const tabs = useMemo(
    () => [
      { id: 'all', label: t('admin_tab_all'), count: orderDisputes.length + contractDisputes.length },
      { id: 'orders', label: t('admin_tab_orders'), count: orderDisputes.length },
      { id: 'contracts', label: t('admin_tab_contracts'), count: contractDisputes.length },
      { id: 'resolved', label: t('admin_tab_resolved') },
    ],
    [t, orderDisputes.length, contractDisputes.length],
  )

  const executePending = async () => {
    if (!pending) return
    setActionId(pending.id)
    try {
      if (pending.type === 'order') {
        await api.adminResolveOrder(
          pending.id,
          pending.resolution as 'completed' | 'cancelled' | 'active',
        )
        setOrderDisputes((prev) => prev.filter((o) => o.id !== pending.id))
      } else {
        await api.adminResolveDispute(pending.id, pending.resolution)
        setContractDisputes((prev) => prev.filter((d) => d.id !== pending.id))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error_required'))
    } finally {
      setActionId(null)
      setPending(null)
    }
  }

  const showOrders = tab === 'all' || tab === 'orders' || tab === 'resolved'
  const showContracts = tab === 'all' || tab === 'contracts' || tab === 'resolved'
  const isResolvedView = tab === 'resolved'

  return (
    <AdminLayout onRefresh={load} refreshing={loading}>
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      <AdminTabs tabs={tabs} activeId={tab} onChange={(id) => setTab(id as DisputeTab)} className="mb-6" />

      {loading && orderDisputes.length === 0 && contractDisputes.length === 0 ? (
        <LoadingBlock className="py-12" />
      ) : (
        <div className="space-y-6">
          {showOrders && (
            <Card className="p-5">
              <h2 className="mb-4 text-[15px] font-semibold text-[var(--admin-text)]">
                {t('admin_order_disputes')}
                <span className="ml-2 text-[13px] font-normal text-[var(--admin-muted)]">({orderDisputes.length})</span>
              </h2>
              {orderDisputes.length === 0 ? (
                <p className="text-sm text-[var(--admin-muted)]">{t('admin_empty_disputes')}</p>
              ) : (
                <ul className="divide-y divide-[var(--admin-border)]">
                  {orderDisputes.map((o) => (
                    <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-[var(--admin-text)]">{o.services?.title ?? o.id.slice(0, 8)}</p>
                        {o.dispute_reason && (
                          <p className="mt-1 line-clamp-2 text-[12px] text-[var(--admin-muted)]">{o.dispute_reason}</p>
                        )}
                        <p className="mt-1 font-mono text-[11px] text-[var(--admin-muted)]">{o.id.slice(0, 8)}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <OrderStatusBadge status={o.status} />
                        <span className="font-semibold">{formatPrice(o.amount)}</span>
                        {o.payment_status && <PaymentStatusBadge status={o.payment_status} />}
                      </div>
                      {!isResolvedView && (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            className="min-h-10"
                            loading={actionId === o.id}
                            onClick={() =>
                              setPending({
                                type: 'order',
                                id: o.id,
                                resolution: 'completed',
                                label: t('admin_resolve_complete'),
                              })
                            }
                          >
                            {t('admin_resolve_complete')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-h-10"
                            disabled={actionId === o.id}
                            onClick={() =>
                              setPending({
                                type: 'order',
                                id: o.id,
                                resolution: 'active',
                                label: t('admin_resolve_rework'),
                              })
                            }
                          >
                            {t('admin_resolve_rework')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-h-10"
                            disabled={actionId === o.id}
                            onClick={() =>
                              setPending({
                                type: 'order',
                                id: o.id,
                                resolution: 'cancelled',
                                label: t('admin_resolve_cancel'),
                              })
                            }
                          >
                            {t('admin_resolve_cancel')}
                          </Button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          {showContracts && (
            <Card className="p-5">
              <h2 className="mb-4 text-[15px] font-semibold text-[var(--admin-text)]">
                {t('admin_contract_disputes')}
                <span className="ml-2 text-[13px] font-normal text-[var(--admin-muted)]">({contractDisputes.length})</span>
              </h2>
              {contractDisputes.length === 0 ? (
                <p className="text-sm text-[var(--admin-muted)]">{t('admin_empty_disputes')}</p>
              ) : (
                <ul className="divide-y divide-[var(--admin-border)]">
                  {contractDisputes.map((d) => (
                    <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-[var(--admin-text)]">
                          {d.contract?.title ?? d.contract_id.slice(0, 8)}
                        </p>
                        <p className="mt-1 line-clamp-2 text-[12px] text-[var(--admin-muted)]">{d.reason}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="text-[11px] text-[var(--admin-muted)]">
                            {t('admin_dispute_status')}: {d.status}
                          </span>
                          {d.contract?.amount != null && (
                            <span className="text-[12px] font-semibold">{formatPrice(d.contract.amount)}</span>
                          )}
                          {d.contract_id && (
                            <Link
                              href={dashboardContract(d.contract_id)}
                              className="text-[12px] font-medium text-[var(--color-primary)] hover:underline"
                            >
                              {t('admin_view_all')}
                            </Link>
                          )}
                        </div>
                      </div>
                      {!isResolvedView && (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            className="min-h-10"
                            loading={actionId === d.id}
                            onClick={() =>
                              setPending({
                                type: 'contract',
                                id: d.id,
                                resolution: 'resolved_freelancer',
                                label: t('admin_resolve_freelancer'),
                              })
                            }
                          >
                            {t('admin_resolve_freelancer')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-h-10"
                            disabled={actionId === d.id}
                            onClick={() =>
                              setPending({
                                type: 'contract',
                                id: d.id,
                                resolution: 'resolved_client',
                                label: t('admin_resolve_client'),
                              })
                            }
                          >
                            {t('admin_resolve_client')}
                          </Button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>
      )}

      <ConfirmModal
        open={pending != null}
        title={t('admin_confirm_resolve')}
        description={`${pending?.label ?? ''}. ${t('admin_confirm_resolve_desc')}`}
        danger={pending?.resolution === 'cancelled' || pending?.resolution === 'resolved_client'}
        confirmLabel={pending?.label}
        onConfirm={executePending}
        onCancel={() => setPending(null)}
      />
    </AdminLayout>
  )
}
