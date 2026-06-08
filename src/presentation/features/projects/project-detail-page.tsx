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

export function ProjectDetailPage({ projectId }: { projectId: string }) {
  const { t, isLoggedIn, currentUserRole, userId, language, profile } = useApp()
  const router = useRouter()
  const [project, setProject] = useState<ApiProject | null>(null)
  const [applications, setApplications] = useState<ApiProjectApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [appsLoadError, setAppsLoadError] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [proposedBudget, setProposedBudget] = useState('')
  const [proposedDays, setProposedDays] = useState('7')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const isOwner = Boolean(userId && project?.client_id === userId)
  const isFreelancer = currentUserRole === 'freelancer'

  const loadProject = useCallback(() => {
    setLoading(true)
    setLoadError(false)
    api
      .getProject(projectId)
      .then((p) => {
        setProject(p)
        setProposedBudget(String(p.budget))
      })
      .catch((e) => {
        setProject(null)
        setLoadError(!(e instanceof ApiError && e.status === 404))
      })
      .finally(() => setLoading(false))
  }, [projectId])

  useEffect(() => {
    loadProject()
  }, [loadProject])

  useEffect(() => {
    if (!isLoggedIn) return
    syncSavedProjectsFromApi().then(() => setSaved(isProjectSaved(projectId)))
  }, [isLoggedIn, projectId])

  useEffect(() => {
    if (!isOwner || !project) return
    setAppsLoadError(false)
    api
      .listProjectApplications(projectId)
      .then(setApplications)
      .catch(() => {
        setApplications([])
        setAppsLoadError(true)
      })
  }, [isOwner, project, projectId])

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

  const updateAppStatus = async (appId: string, status: ApiProjectApplication['status']) => {
    try {
      const updated = await api.updateApplicationStatus(appId, status)
      setApplications((prev) => prev.map((a) => (a.id === appId ? updated : a)))
      toast.success(t('application_status_updated'))
    } catch {
      toast.error(t('error_required'))
    }
  }

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
      <PageWrapper className="bg-[var(--kwork-bg)] pt-5">
        <div className="h-48 animate-pulse rounded-xl bg-[var(--color-bg-muted)]" />
      </PageWrapper>
    )
  }

  if (!project) {
    return (
      <PageWrapper className="bg-[var(--kwork-bg)] pt-5">
        {loadError ? (
          <Alert variant="error">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>{t('data_load_failed')}</span>
              <Button variant="outline" size="sm" onClick={loadProject}>
                {t('catalog_retry')}
              </Button>
            </div>
          </Alert>
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

  const projectStatusLabel =
    project.status === 'open' ? t('project_status_open') : project.status === 'closed' ? t('project_status_closed') : project.status

  return (
    <PageWrapper className="bg-[var(--kwork-bg)] pt-5 md:pt-6">
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
              <h1 className="text-[22px] font-bold text-[var(--kwork-text)] sm:text-[24px]">{project.title}</h1>
              <p className="mt-2 text-[13px] text-[var(--kwork-text-muted)]">
                {project.region} · {project.category} · {project.level}
              </p>
              <Badge variant={project.status === 'open' ? 'success' : 'outline'} size="xs" className="mt-2">
                {projectStatusLabel}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {!isOwner && (
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--kwork-border)] text-[var(--kwork-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                  aria-label={saved ? t('unsave') : t('save')}
                >
                  <Bookmark className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} />
                </button>
              )}
              <p className="text-[20px] font-bold tabular-nums text-[var(--kwork-text)]">{formatPrice(project.budget)}</p>
            </div>
          </div>

          <p className="mt-4 whitespace-pre-wrap text-[14px] leading-relaxed text-[var(--kwork-text-sub)]">
            {project.description}
          </p>

          {project.skills.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {project.skills.map((skill) => (
                <Badge key={skill} variant="outline" size="xs">
                  {skill}
                </Badge>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-4 text-[13px] text-[var(--kwork-text-muted)]">
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
              {appsLoadError && (
                <Alert variant="error" className="mb-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span>{t('data_load_failed')}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAppsLoadError(false)
                        api
                          .listProjectApplications(projectId)
                          .then(setApplications)
                          .catch(() => setAppsLoadError(true))
                      }}
                    >
                      {t('catalog_retry')}
                    </Button>
                  </div>
                </Alert>
              )}
              {applications.length === 0 ? (
                <p className="text-[13px] text-[var(--kwork-text-muted)]">{t('project_no_applications')}</p>
              ) : (
                <div className="space-y-3">
                  {applications.map((app) => (
                    <div key={app.id} className="dashboard-order-card">
                      <p className="text-[14px] font-bold">{app.freelancer_profile?.full_name ?? '—'}</p>
                      <p className="mt-1 text-[12px] text-[var(--kwork-text-muted)]">{statusLabel(app.status)}</p>
                      <p className="mt-2 line-clamp-3 text-[13px]">{app.cover_letter}</p>
                      <p className="mt-2 text-[13px] font-semibold">{formatPrice(app.proposed_budget)}</p>
                      {app.status === 'submitted' && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button size="sm" variant="primary" onClick={() => updateAppStatus(app.id, 'shortlisted')}>
                            {t('application_shortlist')}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updateAppStatus(app.id, 'rejected')}>
                            {t('application_reject')}
                          </Button>
                        </div>
                      )}
                      {app.status === 'shortlisted' && (
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
                <span className="text-[13px] font-medium text-[var(--kwork-text-sub)]">
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
            <p className="truncate text-[13px] font-semibold text-[var(--kwork-text)]">{project.title}</p>
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
