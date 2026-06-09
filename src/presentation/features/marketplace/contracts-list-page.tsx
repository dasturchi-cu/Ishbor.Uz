'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useApp } from '@/application/providers/app-provider'
import { useDashboardRole } from '@/presentation/components/auth/role-guard'
import { api } from '@/infrastructure/api/client'
import type { ApiContract } from '@/infrastructure/api/types'
import { dashboardContract } from '@/domain/constants/routes'
import { formatPrice } from '@/shared/lib/format'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { FileSignature } from 'lucide-react'

export function ContractsListPage() {
  const { t } = useApp()
  const role = useDashboardRole()
  const [contracts, setContracts] = useState<ApiContract[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .listContracts({ role: role === 'client' ? 'client' : 'freelancer' })
      .then(setContracts)
      .catch(() => setContracts([]))
      .finally(() => setLoading(false))
  }, [role])

  if (loading) return <p className="p-6 text-muted-foreground">{t('loading_data')}</p>

  if (!contracts.length) {
    return (
      <EmptyState
        icon={<FileSignature className="h-10 w-10" />}
        title={t('no_contracts')}
        description={t('no_contracts_hint')}
      />
    )
  }

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6 space-y-4">
      <h1 className="text-2xl font-bold">{t('contracts')}</h1>
      <ul className="space-y-3">
        {contracts.map((c) => (
          <li key={c.id}>
            <Link
              href={dashboardContract(c.id)}
              className="block rounded-xl border bg-card p-4 hover:border-primary transition-colors"
            >
              <div className="flex justify-between gap-4">
                <div>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-sm text-muted-foreground capitalize">{c.status}</p>
                </div>
                <p className="font-semibold">{formatPrice(c.amount)}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
