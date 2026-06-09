'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/application/providers/app-provider'
import { api } from '@/infrastructure/api/client'
import type { ApiContract } from '@/infrastructure/api/types'
import { formatPrice } from '@/shared/lib/format'
import { Shield } from 'lucide-react'

export function EscrowDashboardPage() {
  const { t } = useApp()
  const [contracts, setContracts] = useState<ApiContract[]>([])
  const [heldTotal, setHeldTotal] = useState(0)

  useEffect(() => {
    api.listContracts().then(async (list) => {
      setContracts(list)
      const held = list.filter((c) => c.payment_status === 'held')
      setHeldTotal(held.reduce((s, c) => s + c.amount, 0))
    })
  }, [])

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        {t('escrow_dashboard')}
      </h1>
      <div className="rounded-xl border bg-card p-6">
        <p className="text-sm text-muted-foreground">{t('escrow_held_total')}</p>
        <p className="text-3xl font-bold mt-1">{formatPrice(heldTotal)}</p>
        <p className="text-xs text-muted-foreground mt-2">{t('escrow_sandbox_note')}</p>
      </div>
      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3">{t('contract')}</th>
              <th className="text-left p-3">{t('status')}</th>
              <th className="text-right p-3">{t('amount')}</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3">{c.title}</td>
                <td className="p-3 capitalize">{c.payment_status}</td>
                <td className="p-3 text-right">{formatPrice(c.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
