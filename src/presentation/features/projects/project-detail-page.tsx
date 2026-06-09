'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { PageWrapper } from '@/presentation/components/layout/page-wrapper'
import { Breadcrumb } from '@/presentation/components/layout/breadcrumb'
import { Button } from '@/presentation/components/ui/button'
import { Textarea } from '@/presentation/components/ui/textarea'
import { Input } from '@/presentation/components/ui/input'
import { Alert } from '@/presentation/components/ui/alert'
import { LoadErrorAlert } from '@/presentation/components/ui/load-error-alert'
import { Badge } from '@/presentation/components/ui/badge'
import { api, ApiError } from '@/infrastructure/api/client'
import type { ApiProject, ApiProjectApplication } from '@/infrastructure/api/types'
import { PATHS, projectPath } from '@/domain/constants/routes'
import { formatPrice } from '@/shared/lib/format'
import { loginPath } from '@/shared/lib/auth-redirect'
import { toast } from '@/presentation/components/ui/toast'
import { formatDate } from '@/shared/lib/format-date'
import { Bookmark, Briefcase } from 'lucide-react'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { isProjectSaved, syncSavedProjectsFromApi, toggleSavedProject } from '@/shared/lib/saved-items'
import { AiSuggestButton } from '@/presentation/components/ui/ai-suggest-button'
import {
  PROJECT_STATUS_KEYS,
  marketplaceStatusLabel,
  projectStatusBadgeVariant,
} from '@/shared/lib/marketplace-status'
import { dashboardContract } from '@/domain/constants/routes'

export function ProjectDetailPage({ projectId }: { projectId: string }) {
  const { t, isLoggedIn, isAuthLoading, currentUserRole, userId, language, profile } = useApp()
  const router = useRouter()
  const [project, setProject] = useState<ApiProject | null>(null)
  const [applications, setApplications] = useState<ApiProjectApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<unknown>(null)
  const [appsFetchError, setAppsFetchError] = useState<unknown>(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [proposedBudget, setProposedBudget] = useState('')
  const [proposedDays, setProposedDays] = useState('7')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editBudget, setEditBudget] = useState('')
  const [savingProject, setSavingProject] = useState(false)
  const [archiving, setArchiving] = useState(false)

  const isOwner = Boolean(userId && project?.client_id === userId)
  const isFreelancer = currentUserRole === 'freelancer'

  const loadProject = useCallback(() => {
    setLoading(true)
    setFetchError(null)
    api
      .getProject(projectId)
      .then((p) => {
        setProject(p)
        setProposedBudget(String(p.budget))
        setEditTitle(p.title)
        setEditDescription(p.description)
        setEditBudget(String(p.budget))
      })
      .catch((e) => {
        setProject(null)
        setFetchError(e instanceof ApiError && e.status === 404 ? null : e)
      })
      .finally(() => setLoading(false))
  }, [projectId])

  useEffect(() => {
    loadProject()
  }, [loadProject])

  useEffect(() => {
    if (isAuthLoading || !isLoggedIn) return
    syncSavedProjectsFromApi().then(() => setSaved(isProjectSaved(projectId)))
  }, [isAuthLoading, isLoggedIn, projectId])

  useEffect(() => {
    if (isAuthLoading || !isOwner || !project) return
    setAppsFetchError(null)
    api
      .listProjectApplications(projectId)
      .then(setApplications)
      .catch((e) => {
        setApplications([])
        setAppsFetchError(e)
      })
  }, [isAuthLoading, isOwner, project, projectId])

  const handleSave = async () => {
    if (!isLoggedIn) {
      router.push(loginPath(projectPath(projectId)))
      return
    }
    const next = await toggleSavedProject(projectId)
    setSaved(next)
    toast.success(next ? t('saved') : t('unsave'))
  }

  const handleApply = async () => {
    if (!isLoggedIn) {
      router.push(loginPath(projectPath(projectId)))
      return
    }
    if (!isFreelancer) {
      toast.error(t('application_freelancer_only'))
      return
    }
    const budget = parseInt(proposedBudget.replace(/\D/g, ''), 10)
    const days = parseInt(proposedDays, 10)
    if (!coverLetter.trim() || coverLetter.trim().length < 10) {
      setError(t('application_cover_min'))
      return
    }
    if (!budget || budget <= 0) {
      setError(t('application_budget_required'))
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await api.createApplication({
        project_id: projectId,
        cover_letter: coverLetter.trim(),
        proposed_budget: budget,
        proposed_days: days || 7,
      })
      toast.success(t('application_submitted'))
      router.push(PATHS.dashboardApplications)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('error_required'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveProject = async () => {
    const budget = parseInt(editBudget.replace(/\D/g, ''), 10)
    if (!editTitle.trim() || editDescription.trim().length < 10 || !budget) {
      toast.error(t('error_required'))
      return
    }
    setSavingProject(true)
    try {
      const updated = await api.updateProject(projectId, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        budget,
      })
      setProject(updated)
      setEditing(false)
      toast.success(t('project_updated'))
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('error_required'))
    } finally {
      setSavingProject(false)
    }
  }

  const handleArchiveProject = async () => {
    if (!window.confirm(t('project_archive_confirm'))) return
    setArchiving(true)
    try {
      const updated = await api.updateProjectStatus(projectId, 'closed')
      setProject(updated)
      toast.success(t('project_archived'))
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('error_required'))
    } finally {
      setArchiving(false)
    }
  }

  const updateAppStatus = async (appId: string, status: ApiProjectApplication['status']) => {
    try {
      const updated = await api.updateApplicationStatus(appId, status)
      setApplications((prev) => prev.map((a) => (a.id === appId ? updated : a)))
      if (status === 'hired') {
        loadProject()
      }
      toast.success(t('application_status_updated'))
    } catch {
      toast.error(t('error_required'))
    }
  }

  const canManageApplications = ['open', 'in_review'].includes(project?.status ?? '')

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      submitted: t('application_status_submitted'),
      shortlisted: t('application_status_shortlisted'),
      rejected: t('application_status_rejected'),
      hired: t('application_status_hired'),
    }
    return map[s] ?? s
  }

  if (loading) {
    return (
      <PageWrapper className="bg-[var(--ishbor-bg)] pt-5">
        <div className="h-48 animate-pulse rounded-xl bg-[var(--color-bg-muted)]" />
      </PageWrapper>
    )
  }

  if (!project) {
    return (
      <PageWrapper className="bg-[var(--ishbor-bg)] pt-5">
        {fetchError ? (
          <LoadErrorAlert error={fetchError} scope="projects" onRetry={loadProject} />
        ) : (
          <EmptyState
            icon={<Briefcase />}
            title={t('project_not_found')}
            description={t('project_not_found_desc')}
            action={{ label: t('nav_projects'), onClick: () => router.push(PATHS.projects) }}
            secondaryAction={{
              label: t('post_project'),
              onClick: () => router.push(PATHS.postProject),
              variant: 'outline',
            }}
          />
        )}
      </PageWrapper>
    )
  }

  const projectStatusLabel = marketplaceStatusLabel(PROJECT_STATUS_KEYS, project.status, t)

  return (
    <PageWrapper className="bg-[var(--ishbor-bg)] pt-5 md:pt-6">
      <Breadcrumb
        items={[
          { label: t('home'), href: PATHS.home },
          { label: t('projects_title'), href: PATHS.projects },
          { label: project.title },
        ]}
      />

      <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_360px]">
        <article className="surface-panel p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-[22px] font-bold text-[var(--ishbor-text)] sm:text-[24px]">{project.title}</h1>
              <p className="mt-2 text-[13px] text-[var(--ishbor-text-muted)]">
                {project.region} · {project.category} · {project.level}
              </p>
              <Badge variant={projectStatusBadgeVariant(project.status)} size="xs" className="mt-2">
                {projectStatusLabel}
              </Badge>
              {project.contract_id && (
                <Link
                  href={dashboardContract(project.contract_id)}
                  className="mt-2 inline-flex text-[13px] font-medium text-[var(--color-primary)] hover:underline"
                >
                  {t('contract_details')} →
                </Link>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isOwner && project.status === 'open' && (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing((v) => !v)}>
                    {t('project_edit')}
                  </Button>
                  <Button variant="outline" size="sm" loading={archiving} onClick={handleArchiveProject}>
                    {t('project_archive')}
                  </Button>
                </div>
              )}
              {!isOwner && (
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--ishbor-border)] text-[var(--ishbor-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                  aria-label={saved ? t('unsave') : t('save')}
                >
                  <Bookmark className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} />
                </button>
              )}
              <p className="text-[20px] font-bold tabular-nums text-[var(--ishbor-text)]">{formatPrice(project.budget)}</p>
            </div>
          </div>

          {editing && isOwner ? (
            <div className="mt-4 space-y-3">
              <Input label={t('project_title')} value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={6}
                placeholder={t('project_desc_default')}
              />
              <Input
                label={t('project_proposed_budget')}
                value={editBudget}
                onChange={(e) => setEditBudget(e.target.value)}
              />
              <div className="flex gap-2">
                <Button variant="primary" size="sm" loading={savingProject} onClick={handleSaveProject}>
                  {t('project_save')}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                  {t('cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-4 whitespace-pre-wrap text-[14px] leading-relaxed text-[var(--ishbor-text-sub)]">
              {project.description}
            </p>
          )}

          {project.skills.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {project.skills.map((skill) => (
                <Badge key={skill} variant="outline" size="xs">
                  {skill}
                </Badge>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-4 text-[13px] text-[var(--ishbor-text-muted)]">
            {project.deadline && (
              <span>
                {t('project_deadline')}: {formatDate(project.deadline, language)}
              </span>
            )}
            <span>
              {t('project_applications_count').replace('{n}', String(project.application_count ?? 0))}
            </span>
            <span>{project.profiles?.full_name ?? '—'}</span>
          </div>
        </article>

        <aside className="space-y-4">
          {isOwner ? (
            <div className="surface-panel p-5">
              <h2 className="settings-section-title mb-3">{t('project_applications_title')}</h2>
              {appsFetchError != null && (
                <LoadErrorAlert
                  error={appsFetchError}
                  scope="applications"
                  className="mb-3"
                  onRetry={() => {
                    setAppsFetchError(null)
                    api
                      .listProjectApplications(projectId)
                      .then(setApplications)
                      .catch((e) => setAppsFetchError(e))
                  }}
                />
              )}
              {applications.length === 0 ? (
                <p className="text-[13px] text-[var(--ishbor-text-muted)]">{t('project_no_applications')}</p>
              ) : (
                <div className="space-y-3">
                  {applications.map((app) => (
                    <div key={app.id} className="dashboard-order-card">
                      <p className="text-[14px] font-bold">{app.freelancer_profile?.full_name ?? '—'}</p>
                      <p className="mt-1 text-[12px] text-[var(--ishbor-text-muted)]">{statusLabel(app.status)}</p>
                      <p className="mt-2 line-clamp-3 text-[13px]">{app.cover_letter}</p>
                      <p className="mt-2 text-[13px] font-semibold">{formatPrice(app.proposed_budget)}</p>
                      {canManageApplications && app.status === 'submitted' && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button size="sm" variant="primary" onClick={() => updateAppStatus(app.id, 'shortlisted')}>
                            {t('application_shortlist')}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updateAppStatus(app.id, 'rejected')}>
                            {t('application_reject')}
                          </Button>
                        </div>
                      )}
                      {canManageApplications && app.status === 'shortlisted' && (
                        <Button size="sm" variant="primary" className="mt-3" onClick={() => updateAppStatus(app.id, 'hired')}>
                          {t('application_hire')}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <Link href={PATHS.dashboardProjects} className="mt-4 inline-block text-[13px] font-medium text-[var(--color-primary)]">
                {t('nav_my_projects')} →
              </Link>
            </div>
          ) : project.status === 'open' ? (
            <div id="project-apply" className="surface-panel p-5">
              <h2 className="settings-section-title mb-3">{t('project_apply')}</h2>
              {error && (
                <Alert variant="error" className="mb-3">
                  {error}
                </Alert>
              )}
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[13px] font-medium text-[var(--ishbor-text-sub)]">
                  {t('project_cover_letter')}
                </span>
                <AiSuggestButton
                  kind="cover_letter"
                  context={{
                    title: project.title,
                    project_description: project.description,
                    specialty: profile?.specialty ?? profile?.full_name ?? undefined,
                  }}
                  onApply={setCoverLetter}
                />
              </div>
              <Textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={4}
                placeholder={t('project_cover_letter_ph')}
              />
              <Input
                className="mt-3"
                label={t('project_proposed_budget')}
                value={proposedBudget}
                onChange={(e) => setProposedBudget(e.target.value)}
              />
              <Input
                className="mt-3"
                label={t('project_proposed_days')}
                type="number"
                min={1}
                max={365}
                value={proposedDays}
                onChange={(e) => setProposedDays(e.target.value)}
              />
              <Button variant="primary" fullWidth className="mt-4" loading={submitting} onClick={handleApply}>
                {isLoggedIn ? t('project_apply') : t('login_to_apply')}
              </Button>
            </div>
          ) : (
            <Alert variant="info">{t('project_closed')}</Alert>
          )}
        </aside>
      </div>

      {!isOwner && project.status === 'open' && (
        <div className="mobile-sticky-cta show-mobile">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-[var(--ishbor-text)]">{project.title}</p>
            <p className="text-[16px] font-bold tabular-nums text-[var(--color-primary)]">
              {formatPrice(project.budget)}
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            loading={submitting}
            className="shrink-0 px-5"
            onClick={() => {
              if (!isLoggedIn) {
                router.push(loginPath(projectPath(projectId)))
                return
              }
              const el = document.getElementById('project-apply')
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                return
              }
              void handleApply()
            }}
          >
            {isLoggedIn ? t('project_apply') : t('login_to_apply')}
          </Button>
        </div>
      )}
    </PageWrapper>
  )
}
