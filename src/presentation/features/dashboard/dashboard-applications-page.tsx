'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { Badge } from '@/presentation/components/ui/badge'
import { api } from '@/infrastructure/api/client'
import type { ApiProjectApplication } from '@/infrastructure/api/types'
import { PATHS, projectPath } from '@/domain/constants/routes'
import { formatPrice } from '@/shared/lib/format'
import { FileText } from 'lucide-react'

export function DashboardApplicationsPage() {
  const { t } = useApp()
  const router = useRouter()
  const [apps, setApps] = useState<ApiProjectApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const loadApps = useCallback(() => {
    setLoading(true)
    setLoadError(false)
    api
      .listMyApplications()
      .then(setApps)
      .catch(() => {
        setApps([])
        setLoadError(true)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadApps()
  }, [loadApps])

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

  return (
    <div>
      {loadError && (
        <div className="mb-4 rounded-lg border border-[var(--error)]/30 bg-[var(--error-bg)] px-4 py-3 text-[13px] text-[var(--error-dark)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{t('data_load_failed')}</span>
            <button
              type="button"
              className="font-semibold text-[var(--color-primary)] hover:underline"
              onClick={loadApps}
            >
              {t('catalog_retry')}
            </button>
          </div>
        </div>
      )}
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-[var(--color-bg-muted)]" />
          ))}
        </div>
      ) : apps.length === 0 ? (
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
          {apps.map((app) => (
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
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
