'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { useDashboardRole } from '@/presentation/components/auth/role-guard'
import { api } from '@/infrastructure/api/client'
import { dashboardContract, PATHS } from '@/domain/constants/routes'
import { formatPrice } from '@/shared/lib/format'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { FileSignature } from 'lucide-react'
import { useProtectedLoader } from '@/shared/lib/use-protected-loader'
import { LoadErrorAlert } from '@/presentation/components/ui/load-error-alert'
import { SkeletonListRow } from '@/presentation/components/ui/skeleton'
import { ContractStatusBadge } from '@/presentation/components/features/contract-status-badge'
import { PaymentStatusBadge } from '@/presentation/components/features/payment-status-badge'

export function ContractsListPage() {
  const { t } = useApp()
  const router = useRouter()
  const role = useDashboardRole()
  const isClient = role === 'client'
  const {
    data: contracts,
    loading,
    error: contractsLoadFailed,
    loadError: contractsFetchError,
    reload,
  } = useProtectedLoader(
    () => api.listContracts({ role: role === 'client' ? 'client' : 'freelancer' }),
    [role]
  )
  const list = contracts ?? []

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-3 p-4 md:p-6" role="status" aria-live="polite">
        <SkeletonListRow lines={1} />
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonListRow key={i} />
        ))}
      </div>
    )
  }

  if (contractsLoadFailed) {
    return (
      <div className="mx-auto max-w-4xl p-4 md:p-6">
        <LoadErrorAlert
          error={contractsFetchError}
          scope="contracts"
          onRetry={() => void reload()}
        />
      </div>
    )
  }

  if (!list.length) {
    return (
      <div className="mx-auto max-w-4xl p-4 md:p-6">
        <EmptyState
          icon={<FileSignature className="h-10 w-10" />}
          title={t('no_contracts')}
          description={isClient ? t('no_contracts_client_hint') : t('no_contracts_freelancer_hint')}
          action={{
            label: isClient ? t('post_new_project') : t('nav_projects'),
            onClick: () => router.push(isClient ? PATHS.postProject : PATHS.projects),
          }}
          secondaryAction={
            isClient
              ? { label: t('nav_projects'), onClick: () => router.push(PATHS.projects), variant: 'outline' }
              : { label: t('nav_my_services'), onClick: () => router.push(PATHS.dashboardServices), variant: 'outline' }
          }
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">{t('contracts')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('no_contracts_hint')}</p>
      </div>
      <ul className="space-y-3">
        {list.map((c) => (
          <li key={c.id}>
            <Link
              href={dashboardContract(c.id)}
              className="block rounded-xl border bg-card p-4 transition-colors hover:border-primary"
            >
              <div className="flex justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{c.title}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <ContractStatusBadge status={c.status} />
                    <PaymentStatusBadge status={c.payment_status} />
                  </div>
                </div>
                <p className="shrink-0 font-semibold">{formatPrice(c.amount)}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
