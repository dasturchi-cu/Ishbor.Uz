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
import { LoadErrorAlert } from '@/presentation/components/ui/load-error-alert'
import { Briefcase, Plus } from 'lucide-react'
import { useAuthReady } from '@/shared/lib/use-auth-ready'
import {
  PROJECT_STATUS_KEYS,
  marketplaceStatusLabel,
  projectStatusBadgeVariant,
} from '@/shared/lib/marketplace-status'
import { captureActionError } from '@/shared/lib/action-error'
import { toast } from '@/presentation/components/ui/toast'
import { clearDashboardSummaryCache } from '@/shared/lib/dashboard-summary-cache'

export function DashboardProjectsPage() {
  const { t } = useApp()
  const { authed, userId, ready } = useAuthReady()
  const router = useRouter()
  const searchParams = useSearchParams()
  const justPosted = searchParams.get('posted') === '1'
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [loading, setLoading] = useState(true)
  const [projectsFetchError, setProjectsFetchError] = useState<unknown>(null)
  const [publishingId, setPublishingId] = useState<string | null>(null)

  const loadProjects = useCallback(() => {
    if (!authed || !userId) {
      setProjects([])
      setLoading(false)
      setProjectsFetchError(null)
      return
    }
    setLoading(true)
    setProjectsFetchError(null)
    api
      .listProjects({ client_id: userId, status: 'all' })
      .then(setProjects)
      .catch((e) => {
        setProjects([])
        setProjectsFetchError(e)
      })
      .finally(() => setLoading(false))
  }, [userId, authed])

  useEffect(() => {
    if (!ready) return
    if (justPosted) clearDashboardSummaryCache('client')
    loadProjects()
  }, [loadProjects, ready, justPosted])

  const projectStatusLabel = (status: string) =>
    marketplaceStatusLabel(PROJECT_STATUS_KEYS, status, t)

  const publishProject = async (projectId: string) => {
    setPublishingId(projectId)
    try {
      await api.publishProject(projectId)
      toast.success(t('project_published_success'))
      loadProjects()
    } catch (e) {
      toast.error(captureActionError(e, { scope: 'project_publish' }, t))
    } finally {
      setPublishingId(null)
    }
  }

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
        <p className="text-[13px] text-[var(--ishbor-text-muted)]">{t('my_projects_desc')}</p>
        <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => router.push(PATHS.postProject)}>
          {t('post_project')}
        </Button>
      </div>

      {projectsFetchError != null && (
        <LoadErrorAlert
          error={projectsFetchError}
          scope="projects"
          onRetry={loadProjects}
          className="mb-4"
        />
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-[var(--color-bg-muted)]" />
          ))}
        </div>
      ) : projects.length === 0 && projectsFetchError == null ? (
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
                  <p className="mt-1 text-[12px] text-[var(--ishbor-text-muted)]">
                    {p.region} · {formatPrice(p.budget)}
                  </p>
                </div>
                <Badge variant={projectStatusBadgeVariant(p.status)} size="xs">
                  {projectStatusLabel(p.status)}
                </Badge>
              </div>
              <p className="mt-2 text-[12px] text-[var(--ishbor-text-muted)]">
                {t('project_applications_count').replace('{n}', String(p.application_count ?? 0))}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.status === 'draft' && (
                  <Button
                    variant="primary"
                    size="sm"
                    loading={publishingId === p.id}
                    onClick={() => void publishProject(p.id)}
                  >
                    {t('project_publish')}
                  </Button>
                )}
                <Link href={projectPath(p.id)}>
                  <Button variant="outline" size="sm">
                    {p.status === 'draft' ? t('project_view_detail') : t('project_view_applications')}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
