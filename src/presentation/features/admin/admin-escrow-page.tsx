'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useApp } from '@/application/providers/app-provider'
import { Card } from '@/presentation/components/ui/card'
import { Alert } from '@/presentation/components/ui/alert'
import { Button } from '@/presentation/components/ui/button'
import { LoadingBlock } from '@/presentation/components/ui/loading-block'
import { api } from '@/infrastructure/api/client'
import type { ApiAdminEscrowSummary, ApiAdminMilestone, ApiEscrowTransaction } from '@/infrastructure/api/types'
import { formatPrice } from '@/shared/lib/format'
import { AdminLayout } from '@/presentation/features/admin/admin-layout'
import { AdminTabs } from '@/presentation/features/admin/admin-tabs'

const PAGE_SIZE = 50

type MainTab = 'transactions' | 'milestones'
type ActionTab = 'all' | 'fund' | 'hold' | 'release' | 'refund'
type SourceTab = 'all' | 'order' | 'contract' | 'milestone'

export function AdminEscrowPage() {
  const { t } = useApp()
  const [mainTab, setMainTab] = useState<MainTab>('transactions')
  const [actionTab, setActionTab] = useState<ActionTab>('all')
  const [sourceTab, setSourceTab] = useState<SourceTab>('all')
  const [summary, setSummary] = useState<ApiAdminEscrowSummary | null>(null)
  const [items, setItems] = useState<ApiEscrowTransaction[]>([])
  const [milestones, setMilestones] = useState<ApiAdminMilestone[]>([])
  const [total, setTotal] = useState(0)
  const [milestonesTotal, setMilestonesTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  const loadSummary = useCallback(async () => {
    try {
      const res = await api.adminEscrowSummary()
      setSummary(res)
    } catch {
      /* optional */
    }
  }, [])

  const loadTransactions = useCallback(
    async (offset = 0, append = false) => {
      if (append) setLoadingMore(true)
      else setLoading(true)
      setError('')
      try {
        const res = await api.adminEscrow({
          limit: PAGE_SIZE,
          offset,
          action: actionTab === 'all' ? undefined : actionTab,
          source_type: sourceTab === 'all' ? undefined : sourceTab,
        })
        setItems((prev) => (append ? [...prev, ...res.items] : res.items))
        setTotal(res.total)
      } catch (e) {
        setError(e instanceof Error ? e.message : t('data_load_failed'))
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [actionTab, sourceTab, t],
  )

  const loadMilestones = useCallback(
    async (offset = 0, append = false) => {
      if (append) setLoadingMore(true)
      else setLoading(true)
      setError('')
      try {
        const res = await api.adminMilestones({ limit: PAGE_SIZE, offset })
        setMilestones((prev) => (append ? [...prev, ...res.items] : res.items))
        setMilestonesTotal(res.total)
      } catch (e) {
        setError(e instanceof Error ? e.message : t('data_load_failed'))
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [t],
  )

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  useEffect(() => {
    if (mainTab === 'transactions') loadTransactions()
    else loadMilestones()
  }, [mainTab, loadTransactions, loadMilestones])

  const mainTabs = useMemo(
    () => [
      { id: 'transactions', label: t('admin_tab_transactions') },
      { id: 'milestones', label: t('admin_tab_milestones'), count: summary?.milestones_count },
    ],
    [t, summary?.milestones_count],
  )

  const actionTabs = useMemo(
    () => [
      { id: 'all', label: t('admin_tab_all') },
      { id: 'fund', label: t('admin_tab_fund') },
      { id: 'hold', label: t('admin_tab_hold') },
      { id: 'release', label: t('admin_tab_release') },
      { id: 'refund', label: t('admin_tab_refund') },
    ],
    [t],
  )

  const sourceTabs = useMemo(
    () => [
      { id: 'all', label: t('admin_tab_all') },
      { id: 'order', label: t('admin_orders') },
      { id: 'contract', label: t('admin_tab_contracts') },
      { id: 'milestone', label: t('admin_tab_milestones') },
    ],
    [t],
  )

  const refresh = () => {
    loadSummary()
    if (mainTab === 'transactions') loadTransactions()
    else loadMilestones()
  }

  return (
    <AdminLayout onRefresh={refresh} refreshing={loading && items.length > 0}>
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      {summary && (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: t('admin_escrow_contract_held'), value: formatPrice(summary.contract_held), sub: `${summary.contracts_count}` },
            { label: t('admin_escrow_milestone_held'), value: formatPrice(summary.milestone_held), sub: `${summary.milestones_count}` },
            { label: t('admin_escrow_total_held'), value: formatPrice(summary.total_held), sub: '—' },
          ].map((card) => (
            <Card key={card.label} className="admin-kpi-card p-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--admin-muted)]">{card.label}</p>
              <p className="mt-1 text-2xl font-bold text-[var(--admin-text)]">{card.value}</p>
            </Card>
          ))}
        </div>
      )}

      <AdminTabs
        tabs={mainTabs}
        activeId={mainTab}
        onChange={(id) => setMainTab(id as MainTab)}
        className="mb-4"
      />

      {mainTab === 'transactions' && (
        <>
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <AdminTabs tabs={actionTabs} activeId={actionTab} onChange={(id) => setActionTab(id as ActionTab)} />
            <AdminTabs tabs={sourceTabs} activeId={sourceTab} onChange={(id) => setSourceTab(id as SourceTab)} />
          </div>

          <Card className="overflow-hidden">
            {loading && items.length === 0 ? (
              <LoadingBlock className="py-12" />
            ) : items.length === 0 ? (
              <p className="p-6 text-sm text-[var(--admin-muted)]">{t('admin_escrow_empty')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="admin-table w-full text-[13px]">
                  <caption className="sr-only">{t('admin_page_escrow')}</caption>
                  <thead>
                    <tr className="border-b border-[var(--admin-border)] bg-[var(--admin-bg)] text-left">
                      <th className="px-4 py-3 font-medium text-[var(--admin-muted)]">{t('date')}</th>
                      <th className="px-4 py-3 font-medium text-[var(--admin-muted)]">{t('admin_escrow_source')}</th>
                      <th className="px-4 py-3 font-medium text-[var(--admin-muted)]">{t('admin_escrow_action')}</th>
                      <th className="px-4 py-3 font-medium text-[var(--admin-muted)]">{t('admin_escrow_amount')}</th>
                      <th className="px-4 py-3 font-medium text-[var(--admin-muted)]">{t('admin_escrow_status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row) => (
                      <tr key={row.id} className="border-b border-[var(--admin-border)] hover:bg-[var(--admin-bg)]">
                        <td className="px-4 py-3 text-[var(--admin-muted)]">
                          {row.created_at?.slice(0, 16).replace('T', ' ') ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded bg-[var(--admin-bg)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--admin-text)]">
                            {row.source_type}
                          </span>
                          <span className="ml-1 font-mono text-[11px] text-[var(--admin-muted)]">
                            {row.source_id?.slice(0, 8)}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-[var(--admin-text)]">{row.action}</td>
                        <td className="px-4 py-3 font-semibold text-[var(--admin-text)]">{formatPrice(row.amount)}</td>
                        <td className="px-4 py-3 text-[var(--admin-muted)]">{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {items.length < total && (
              <div className="flex justify-center border-t border-[var(--admin-border)] p-4">
                <Button variant="outline" loading={loadingMore} onClick={() => loadTransactions(items.length, true)}>
                  {t('admin_load_more')}
                </Button>
              </div>
            )}
          </Card>
        </>
      )}

      {mainTab === 'milestones' && (
        <Card className="overflow-hidden">
          {loading && milestones.length === 0 ? (
            <LoadingBlock className="py-12" />
          ) : milestones.length === 0 ? (
            <p className="p-6 text-sm text-[var(--admin-muted)]">{t('admin_milestones_empty')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table w-full text-[13px]">
                <caption className="sr-only">{t('admin_tab_milestones')}</caption>
                <thead>
                  <tr className="border-b border-[var(--admin-border)] bg-[var(--admin-bg)] text-left">
                    <th className="px-4 py-3 font-medium text-[var(--admin-muted)]">{t('full_name')}</th>
                    <th className="px-4 py-3 font-medium text-[var(--admin-muted)]">{t('admin_escrow_amount')}</th>
                    <th className="px-4 py-3 font-medium text-[var(--admin-muted)]">{t('admin_milestone_status')}</th>
                    <th className="px-4 py-3 font-medium text-[var(--admin-muted)]">{t('admin_escrow_status')}</th>
                    <th className="px-4 py-3 font-medium text-[var(--admin-muted)]">{t('date')}</th>
                  </tr>
                </thead>
                <tbody>
                  {milestones.map((m) => (
                    <tr key={m.id} className="border-b border-[var(--admin-border)] hover:bg-[var(--admin-bg)]">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[var(--admin-text)]">{m.title}</p>
                        <p className="text-[11px] text-[var(--admin-muted)]">
                          {m.contracts?.title ?? m.contract_id.slice(0, 8)}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-semibold">{formatPrice(m.amount)}</td>
                      <td className="px-4 py-3 text-[var(--admin-text)]">{m.status}</td>
                      <td className="px-4 py-3 text-[var(--admin-muted)]">{m.payment_status}</td>
                      <td className="px-4 py-3 text-[var(--admin-muted)]">
                        {m.created_at?.slice(0, 10) ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {milestones.length < milestonesTotal && (
            <div className="flex justify-center border-t border-[var(--admin-border)] p-4">
              <Button variant="outline" loading={loadingMore} onClick={() => loadMilestones(milestones.length, true)}>
                {t('admin_load_more')}
              </Button>
            </div>
          )}
        </Card>
      )}
    </AdminLayout>
  )
}
