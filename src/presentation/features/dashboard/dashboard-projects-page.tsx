'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { Badge } from '@/presentation/components/ui/badge'
import { api } from '@/infrastructure/api/client'
import type { ApiProject } from '@/infrastructure/api/types'
import { PATHS, projectPath } from '@/domain/constants/routes'
import { formatPrice } from '@/shared/lib/format'
import { Alert } from '@/presentation/components/ui/alert'
import { Briefcase, Plus } from 'lucide-react'

export function DashboardProjectsPage() {
  const { t, userId } = useApp()
  const router = useRouter()
  const searchParams = useSearchParams()
  const justPosted = searchParams.get('posted') === '1'
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const loadProjects = useCallback(() => {
    if (!userId) return
    setLoading(true)
    setLoadError(false)
    api
      .listProjects({ client_id: userId, status: 'all' })
      .then(setProjects)
      .catch(() => {
        setProjects([])
        setLoadError(true)
      })
      .finally(() => setLoading(false))
  }, [userId])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const projectStatusLabel = (status: string) =>
    status === 'open' ? t('project_status_open') : status === 'closed' ? t('project_status_closed') : status

  return (
    <div>
      {justPosted && (
        <Alert variant="success" className="mb-4">
          <p>{t('project_posted_success')}</p>
          <Link href={PATHS.freelancers} className="mt-2 inline-block font-semibold text-[var(--color-primary)]">
            {t('find_freelancers_cta')} →
          </Link>
        </Alert>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-[var(--kwork-text-muted)]">{t('my_projects_desc')}</p>
        <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => router.push(PATHS.postProject)}>
          {t('post_project')}
        </Button>
      </div>

      {loadError && (
        <Alert variant="error" className="mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{t('data_load_failed')}</span>
            <Button variant="outline" size="sm" onClick={loadProjects}>
              {t('catalog_retry')}
            </Button>
          </div>
        </Alert>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-[var(--color-bg-muted)]" />
          ))}
        </div>
      ) : projects.length === 0 && !loadError ? (
        <EmptyState
          icon={<Briefcase />}
          title={t('no_projects_yet')}
          action={{ label: t('post_project'), onClick: () => router.push(PATHS.postProject) }}
          secondaryAction={{
            label: t('nav_freelancers'),
            onClick: () => router.push(PATHS.freelancers),
            variant: 'outline',
          }}
        />
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <div key={p.id} className="dashboard-order-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={projectPath(p.id)} className="text-[15px] font-bold hover:text-[var(--color-primary)]">
                    {p.title}
                  </Link>
                  <p className="mt-1 text-[12px] text-[var(--kwork-text-muted)]">
                    {p.region} · {formatPrice(p.budget)}
                  </p>
                </div>
                <Badge variant={p.status === 'open' ? 'success' : 'outline'} size="xs">
                  {projectStatusLabel(p.status)}
                </Badge>
              </div>
              <p className="mt-2 text-[12px] text-[var(--kwork-text-muted)]">
                {t('project_applications_count').replace('{n}', String(p.application_count ?? 0))}
              </p>
              <Link href={projectPath(p.id)} className="mt-3 inline-block">
                <Button variant="outline" size="sm">
                  {t('project_view_applications')}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
