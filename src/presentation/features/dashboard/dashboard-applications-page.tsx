'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { Badge } from '@/presentation/components/ui/badge'
import { api, ApiError } from '@/infrastructure/api/client'
import { Button } from '@/presentation/components/ui/button'
import { toast } from '@/presentation/components/ui/toast'
import type { ApiProjectApplication } from '@/infrastructure/api/types'
import { PATHS, projectPath } from '@/domain/constants/routes'
import { formatPrice } from '@/shared/lib/format'
import { FileText } from 'lucide-react'
import { useProtectedLoader } from '@/shared/lib/use-protected-loader'
import { LoadErrorAlert } from '@/presentation/components/ui/load-error-alert'
export function DashboardApplicationsPage() {
  const { t } = useApp()
  const router = useRouter()
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null)

  const {
    data: apps,
    loading,
    error: appsLoadError,
    loadError: appsFetchError,
    reload: loadApps,
  } = useProtectedLoader(() => api.listMyApplications(), [])

  const statusLabel: Record<ApiProjectApplication['status'], string> = {
    submitted: t('application_status_submitted'),
    shortlisted: t('application_status_shortlisted'),
    rejected: t('application_status_rejected'),
    hired: t('application_status_hired'),
  }

  const statusVariant = (s: ApiProjectApplication['status']) => {
    if (s === 'hired') return 'success' as const
    if (s === 'shortlisted') return 'info' as const
    if (s === 'rejected') return 'error' as const
    return 'outline' as const
  }

  const handleWithdraw = async (appId: string) => {
    if (!window.confirm(t('application_withdraw_confirm'))) return
    setWithdrawingId(appId)
    try {
      await api.withdrawApplication(appId)
      void loadApps()
      toast.success(t('application_withdrawn'))
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('error_required'))
    } finally {
      setWithdrawingId(null)
    }
  }

  return (
    <div>
      {appsLoadError && (
        <LoadErrorAlert error={appsFetchError} scope="applications" onRetry={loadApps} className="mb-4" />
      )}
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-[var(--color-bg-muted)]" />
          ))}
        </div>
      ) : (apps ?? []).length === 0 ? (
        <EmptyState
          icon={<FileText />}
          title={t('my_applications_empty')}
          description={t('my_applications_empty_desc')}
          action={{ label: t('projects_title'), onClick: () => router.push(PATHS.projects) }}
          secondaryAction={{
            label: t('nav_freelancers'),
            onClick: () => router.push(PATHS.freelancers),
            variant: 'outline',
          }}
        />
      ) : (
        <div className="space-y-3">
          {(apps ?? []).map((app) => (
            <div key={app.id} className="dashboard-order-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={projectPath(app.project_id)} className="text-[15px] font-bold text-[var(--kwork-text)] hover:text-[var(--color-primary)]">
                    {app.project?.title ?? t('nav_orders')}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-[13px] text-[var(--kwork-text-muted)]">{app.cover_letter}</p>
                </div>
                <Badge variant={statusVariant(app.status)} size="xs">
                  {statusLabel[app.status]}
                </Badge>
              </div>
              <p className="mt-3 text-[14px] font-bold">{formatPrice(app.proposed_budget)}</p>
              {(app.status === 'submitted' || app.status === 'shortlisted') && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  loading={withdrawingId === app.id}
                  onClick={() => handleWithdraw(app.id)}
                >
                  {t('application_withdraw')}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
