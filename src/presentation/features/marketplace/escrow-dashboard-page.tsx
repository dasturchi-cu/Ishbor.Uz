'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useApp } from '@/application/providers/app-provider'
import { api } from '@/infrastructure/api/client'
import type { ApiContract, ApiMilestone } from '@/infrastructure/api/types'
import { PATHS } from '@/domain/constants/routes'
import { formatPrice } from '@/shared/lib/format'
import { Shield, Layers } from 'lucide-react'
import { useProtectedLoader } from '@/shared/lib/use-protected-loader'
import { PaymentStatusBadge } from '@/presentation/components/features/payment-status-badge'
import { MilestoneStatusBadge } from '@/presentation/components/features/milestone-status-badge'
import { ContractStatusBadge } from '@/presentation/components/features/contract-status-badge'

export function EscrowDashboardPage() {
  const { t } = useApp()
  const { data, loading } = useProtectedLoader(async () => {
    const list = await api.listContracts().catch(() => [] as ApiContract[])
    const all = await Promise.all(
      list.map((c) => api.listContractMilestones(c.id).catch(() => [] as ApiMilestone[]))
    )
    return { contracts: list, milestones: all.flat() }
  }, [])
  const contracts = data?.contracts ?? []

  const contractHeld = useMemo(() => {
    const contracts = data?.contracts ?? []
    return contracts.filter((c) => c.payment_status === 'held').reduce((s, c) => s + c.amount, 0)
  }, [data])

  const milestoneHeld = useMemo(() => {
    const milestones = data?.milestones ?? []
    return milestones
      .filter((m) => m.payment_status === 'held' && m.status !== 'released')
      .reduce((s, m) => s + m.amount, 0)
  }, [data])

  const heldMilestones = useMemo(() => {
    const milestones = data?.milestones ?? []
    return milestones.filter((m) => m.payment_status === 'held' && m.status !== 'released')
  }, [data])

  if (loading) {
    return <p className="p-6 text-muted-foreground">{t('loading_data')}</p>
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <Shield className="h-6 w-6 text-primary" />
        {t('escrow_dashboard')}
      </h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">{t('escrow_held_total')}</p>
          <p className="mt-1 text-3xl font-bold">{formatPrice(contractHeld + milestoneHeld)}</p>
          <p className="mt-2 text-xs text-muted-foreground">{t('escrow_sandbox_note')}</p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">{t('admin_escrow_milestone_held')}</p>
          <p className="mt-1 text-3xl font-bold">{formatPrice(milestoneHeld)}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {heldMilestones.length} {t('milestone_section_title').toLowerCase()}
          </p>
        </div>
      </div>

      {heldMilestones.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="border-b bg-muted/50 px-4 py-3 font-semibold flex items-center gap-2">
            <Layers className="h-4 w-4" />
            {t('milestone_section_title')}
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3">{t('contract')}</th>
                <th className="p-3">{t('status')}</th>
                <th className="p-3 text-right">{t('amount')}</th>
              </tr>
            </thead>
            <tbody>
              {heldMilestones.map((m) => {
                const contract = contracts.find((c) => c.id === m.contract_id)
                return (
                  <tr key={m.id} className="border-t">
                    <td className="p-3">
                      <Link
                        href={`${PATHS.dashboardContracts}/${m.contract_id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {m.title}
                      </Link>
                      {contract && (
                        <p className="text-xs text-muted-foreground">{contract.title}</p>
                      )}
                    </td>
                    <td className="p-3">
                      <MilestoneStatusBadge status={m.status} />
                    </td>
                    <td className="p-3 text-right">{formatPrice(m.amount)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="border-b bg-muted/50 px-4 py-3 font-semibold">{t('contract')}</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="p-3">{t('contract')}</th>
              <th className="p-3">{t('status')}</th>
              <th className="p-3 text-right">{t('amount')}</th>
            </tr>
          </thead>
          <tbody>
            {contracts.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-6 text-center text-muted-foreground">
                  {t('no_contracts')}
                </td>
              </tr>
            ) : (
              contracts.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-3">
                    <Link
                      href={`${PATHS.dashboardContracts}/${c.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {c.title}
                    </Link>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <PaymentStatusBadge status={c.payment_status} />
                      <ContractStatusBadge status={c.status} />
                    </div>
                  </td>
                  <td className="p-3 text-right">{formatPrice(c.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
