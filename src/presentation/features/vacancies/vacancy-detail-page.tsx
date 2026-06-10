'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Briefcase, MapPin, Users } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { PageWrapper } from '@/presentation/components/layout/page-wrapper'
import { Breadcrumb } from '@/presentation/components/layout/breadcrumb'
import { IshborProtectionStrip } from '@/presentation/components/layout/ishbor-protection-strip'
import { Button } from '@/presentation/components/ui/button'
import { Textarea } from '@/presentation/components/ui/textarea'
import { Alert } from '@/presentation/components/ui/alert'
import { LoadErrorAlert } from '@/presentation/components/ui/load-error-alert'
import { Badge } from '@/presentation/components/ui/badge'
import { Avatar } from '@/presentation/components/ui/avatar'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { AiSuggestButton } from '@/presentation/components/ui/ai-suggest-button'
import { api, ApiError } from '@/infrastructure/api/client'
import type { ApiVacancyDetail } from '@/infrastructure/api/types'
import { PATHS, vacancyPath, freelancerPath } from '@/domain/constants/routes'
import { formatPrice } from '@/shared/lib/format'
import { loginPath } from '@/shared/lib/auth-redirect'
import { toast } from '@/presentation/components/ui/toast'
import { formatDate } from '@/shared/lib/format-date'
import type { TranslationKey } from '@/infrastructure/i18n'

const EMPLOYMENT_KEYS: Record<string, TranslationKey> = {
  full_time: 'vacancy_employment_full_time',
  part_time: 'vacancy_employment_part_time',
  contract: 'vacancy_employment_contract',
  internship: 'vacancy_employment_internship',
}

const APPLICATION_STATUS_KEYS: Record<string, TranslationKey> = {
  submitted: 'application_status_submitted',
  reviewed: 'vacancy_application_status_reviewed',
  rejected: 'application_status_rejected',
  accepted: 'vacancy_application_status_accepted',
}

export function VacancyDetailPage({ vacancyId }: { vacancyId: string }) {
  const { t, isLoggedIn, isAuthLoading, currentUserRole, userId, language, profile } = useApp()
  const router = useRouter()
  const [vacancy, setVacancy] = useState<ApiVacancyDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<unknown>(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isOwner = Boolean(userId && vacancy?.client_id === userId)
  const isFreelancer = currentUserRole === 'freelancer'
  const hasApplied = Boolean(vacancy?.my_application_status)

  const loadVacancy = useCallback(() => {
    setLoading(true)
    setFetchError(null)
    api
      .getVacancy(vacancyId)
      .then(setVacancy)
      .catch((e) => {
        setVacancy(null)
        setFetchError(e instanceof ApiError && e.status === 404 ? null : e)
      })
      .finally(() => setLoading(false))
  }, [vacancyId])

  useEffect(() => {
    loadVacancy()
  }, [loadVacancy])

  const employmentLabel = (type: string) => {
    const key = EMPLOYMENT_KEYS[type]
    return key ? t(key) : type
  }

  const applicationStatusLabel = (status: string) => {
    const key = APPLICATION_STATUS_KEYS[status]
    return key ? t(key) : status
  }

  const handleApply = async () => {
    if (!isLoggedIn) {
      router.push(loginPath(vacancyPath(vacancyId)))
      return
    }
    if (!isFreelancer) {
      toast.error(t('application_freelancer_only'))
      return
    }
    if (!coverLetter.trim() || coverLetter.trim().length < 10) {
      setError(t('application_cover_min'))
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await api.applyToVacancy(vacancyId, { cover_letter: coverLetter.trim() })
      toast.success(t('application_submitted'))
      loadVacancy()
      setCoverLetter('')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('error_required'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <PageWrapper className="bg-[var(--ishbor-bg)] pt-5">
        <div className="h-48 animate-pulse rounded-xl bg-[var(--color-bg-muted)]" />
      </PageWrapper>
    )
  }

  if (!vacancy) {
    return (
      <PageWrapper className="bg-[var(--ishbor-bg)] pt-5">
        {fetchError ? (
          <LoadErrorAlert error={fetchError} scope="vacancies" onRetry={loadVacancy} />
        ) : (
          <EmptyState
            icon={<Briefcase />}
            title={t('vacancy_not_found')}
            description={t('vacancy_not_found_desc')}
            action={{ label: t('jobs_catalog_title'), onClick: () => router.push(PATHS.jobs) }}
          />
        )}
      </PageWrapper>
    )
  }

  const client = vacancy.client_profile
  const salaryRange =
    vacancy.salary_min != null || vacancy.salary_max != null
      ? `${vacancy.salary_min != null ? formatPrice(vacancy.salary_min) : '—'}${
          vacancy.salary_max != null ? ` – ${formatPrice(vacancy.salary_max)}` : ''
        }`
      : null

  return (
    <PageWrapper className="bg-[var(--ishbor-bg)] pt-5 md:pt-6">
      <Breadcrumb
        items={[
          { label: t('home'), href: PATHS.home },
          { label: t('jobs_catalog_title'), href: PATHS.jobs },
          { label: vacancy.title },
        ]}
      />

      <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_360px]">
        <article className="surface-panel p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-[22px] font-bold text-[var(--ishbor-text)] sm:text-[24px]">{vacancy.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[var(--ishbor-text-muted)]">
                {vacancy.region && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {vacancy.region}
                  </span>
                )}
                <span>{employmentLabel(vacancy.employment_type)}</span>
              </div>
              {salaryRange && (
                <p className="mt-3 text-[18px] font-bold tabular-nums text-[var(--color-primary)]">{salaryRange}</p>
              )}
            </div>
            {hasApplied && (
              <Badge variant="success" size="sm">
                {applicationStatusLabel(vacancy.my_application_status!)}
              </Badge>
            )}
          </div>

          {vacancy.description && (
            <p className="mt-5 whitespace-pre-wrap text-[14px] leading-relaxed text-[var(--ishbor-text-sub)]">
              {vacancy.description}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-4 border-t border-[var(--ishbor-border)] pt-4 text-[13px] text-[var(--ishbor-text-muted)]">
            {vacancy.created_at && (
              <span>
                {t('vacancy_posted')}: {formatDate(vacancy.created_at, language)}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" aria-hidden />
              {t('vacancy_applications_count').replace('{count}', String(vacancy.application_count ?? 0))}
            </span>
          </div>
        </article>

        <aside className="space-y-4">
          {client && (
            <div className="surface-panel p-5">
              <h2 className="settings-section-title mb-3">{t('vacancy_posted_by')}</h2>
              <Link
                href={freelancerPath(client.id)}
                className="flex items-center gap-3 rounded-lg transition hover:bg-[var(--ishbor-bg-muted)]"
              >
                <Avatar name={client.full_name ?? '—'} src={client.avatar_url} size={48} />
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-[var(--ishbor-text)]">
                    {client.full_name ?? '—'}
                  </p>
                  {client.specialty && (
                    <p className="truncate text-[12px] text-[var(--ishbor-text-muted)]">{client.specialty}</p>
                  )}
                  {client.region && (
                    <p className="mt-0.5 text-[12px] text-[var(--ishbor-text-muted)]">{client.region}</p>
                  )}
                </div>
              </Link>
            </div>
          )}

          {isOwner ? (
            <div className="surface-panel p-5">
              <h2 className="settings-section-title mb-2">{t('vacancy_owner_title')}</h2>
              <p className="text-[13px] text-[var(--ishbor-text-muted)]">{t('vacancy_owner_desc')}</p>
              <Link
                href={PATHS.dashboardProjects}
                className="mt-4 inline-block text-[13px] font-medium text-[var(--color-primary)] hover:underline"
              >
                {t('nav_my_projects')} →
              </Link>
            </div>
          ) : hasApplied ? (
            <div className="surface-panel p-5">
              <h2 className="settings-section-title mb-2">{t('vacancy_applied_title')}</h2>
              <p className="text-[13px] text-[var(--ishbor-text-muted)]">{t('vacancy_applied_desc')}</p>
              <Badge variant="success" size="sm" className="mt-3">
                {applicationStatusLabel(vacancy.my_application_status!)}
              </Badge>
              <Link href={PATHS.dashboardApplications} className="mt-4 block">
                <Button variant="outline" fullWidth>
                  {t('nav_dashboard')} — {t('project_applications_title')}
                </Button>
              </Link>
            </div>
          ) : (
            <div id="vacancy-apply" className="surface-panel p-5">
              <h2 className="settings-section-title mb-2">{t('vacancy_apply_title')}</h2>
              <p className="mb-4 text-[13px] text-[var(--ishbor-text-muted)]">{t('vacancy_apply_desc')}</p>
              {error && (
                <Alert variant="error" className="mb-3">
                  {error}
                </Alert>
              )}
              {!isAuthLoading && isLoggedIn && !isFreelancer ? (
                <Alert variant="info">{t('application_freelancer_only')}</Alert>
              ) : (
                <>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[13px] font-medium text-[var(--ishbor-text-sub)]">
                      {t('project_cover_letter')}
                    </span>
                    <AiSuggestButton
                      kind="cover_letter"
                      context={{
                        title: vacancy.title,
                        project_description: vacancy.description ?? undefined,
                        specialty: profile?.specialty ?? profile?.full_name ?? undefined,
                      }}
                      onApply={setCoverLetter}
                    />
                  </div>
                  <Textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={5}
                    placeholder={t('project_cover_letter_ph')}
                  />
                  <Button
                    variant="primary"
                    fullWidth
                    className="mt-4"
                    loading={submitting}
                    onClick={() => void handleApply()}
                  >
                    {isLoggedIn ? t('vacancy_apply_btn') : t('login_to_apply')}
                  </Button>
                </>
              )}
            </div>
          )}

          <IshborProtectionStrip compact />
        </aside>
      </div>

      <div className="mt-6 hide-mobile">
        <Link href={PATHS.jobs}>
          <Button variant="outline" leftIcon={<Briefcase className="h-4 w-4" />}>
            {t('vacancy_view_jobs')}
          </Button>
        </Link>
      </div>

      {!isOwner && !hasApplied && (
        <div className="mobile-sticky-cta show-mobile">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-[var(--ishbor-text)]">{vacancy.title}</p>
            {salaryRange ? (
              <p className="text-[16px] font-bold tabular-nums text-[var(--color-primary)]">{salaryRange}</p>
            ) : (
              <p className="text-[13px] text-[var(--ishbor-text-muted)]">{employmentLabel(vacancy.employment_type)}</p>
            )}
          </div>
          <Button
            variant="primary"
            size="md"
            loading={submitting}
            className="shrink-0 px-5"
            onClick={() => {
              if (!isLoggedIn) {
                router.push(loginPath(vacancyPath(vacancyId)))
                return
              }
              const el = document.getElementById('vacancy-apply')
              el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          >
            {isLoggedIn ? t('vacancy_apply_btn') : t('login_to_apply')}
          </Button>
        </div>
      )}
    </PageWrapper>
  )
}
