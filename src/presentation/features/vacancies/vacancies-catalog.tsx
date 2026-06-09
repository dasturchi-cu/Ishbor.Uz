'use client'

import { useCallback, useEffect, useState } from 'react'
import { Briefcase, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { api } from '@/infrastructure/api/client'
import type { ApiVacancy } from '@/infrastructure/api/types'
import { PageWrapper } from '@/presentation/components/layout/page-wrapper'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { LoadingBlock } from '@/presentation/components/ui/loading-block'
import { Card } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Textarea } from '@/presentation/components/ui/textarea'
import { Select } from '@/presentation/components/ui/select'
import { UZ_REGIONS } from '@/domain/constants/regions'
import { PATHS } from '@/domain/constants/routes'
import { loginPath } from '@/shared/lib/auth-redirect'
import { formatPrice } from '@/shared/lib/format'
import { toast } from '@/presentation/components/ui/toast'
import { captureActionError } from '@/shared/lib/action-error'
import type { TranslationKey } from '@/infrastructure/i18n'

const EMPLOYMENT_KEYS: Record<string, TranslationKey> = {
  full_time: 'vacancy_employment_full_time',
  part_time: 'vacancy_employment_part_time',
  contract: 'vacancy_employment_contract',
  internship: 'vacancy_employment_internship',
}

export function VacanciesCatalog() {
  const { t, isLoggedIn, currentUserRole } = useApp()
  const router = useRouter()
  const [vacancies, setVacancies] = useState<ApiVacancy[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [region, setRegion] = useState('')
  const [salaryMin, setSalaryMin] = useState('')
  const [salaryMax, setSalaryMax] = useState('')
  const [employmentType, setEmploymentType] = useState<'full_time' | 'part_time' | 'contract' | 'internship'>('full_time')
  const [publish, setPublish] = useState(true)

  const loadVacancies = useCallback(() => {
    setLoading(true)
    api
      .listVacancies({ limit: 24 })
      .then(setVacancies)
      .catch(() => setVacancies([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadVacancies()
  }, [loadVacancies])

  const openCreate = () => {
    if (!isLoggedIn) {
      router.push(loginPath(PATHS.jobs))
      return
    }
    if (currentUserRole !== 'client') {
      toast.error(t('vacancy_client_only'))
      return
    }
    setShowForm(true)
  }

  const submitVacancy = async () => {
    if (title.trim().length < 3) {
      toast.error(t('error_title_short'))
      return
    }
    setSubmitting(true)
    try {
      await api.createVacancy({
        title: title.trim(),
        description: description.trim() || undefined,
        region: region || undefined,
        employment_type: employmentType,
        salary_min: salaryMin ? Number(salaryMin.replace(/\s/g, '')) : undefined,
        salary_max: salaryMax ? Number(salaryMax.replace(/\s/g, '')) : undefined,
        is_published: publish,
      })
      toast.success(t('vacancy_created_success'))
      setShowForm(false)
      setTitle('')
      setDescription('')
      setSalaryMin('')
      setSalaryMax('')
      loadVacancies()
    } catch (e) {
      toast.error(captureActionError(e, { scope: 'vacancy' }, t))
    } finally {
      setSubmitting(false)
    }
  }

  const employmentLabel = (type: string) => {
    const key = EMPLOYMENT_KEYS[type]
    return key ? t(key) : type
  }

  return (
    <PageWrapper>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--kwork-text)]">{t('jobs_catalog_title')}</h1>
          <p className="mt-1 text-[14px] text-[var(--kwork-text-muted)]">{t('jobs_catalog_subtitle')}</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          {t('vacancy_create_btn')}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6 space-y-4 p-5">
          <h2 className="text-[16px] font-bold text-[var(--kwork-text)]">{t('vacancy_create_title')}</h2>
          <Input
            label={t('vacancy_title_label')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('vacancy_title_ph')}
          />
          <Textarea
            label={t('vacancy_description_label')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
          <Select
            label={t('vacancy_region_label')}
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="select-auth"
            options={[
              { value: '', label: t('filter_all_regions') },
              ...UZ_REGIONS.map((r) => ({ value: r, label: r })),
            ]}
          />
          <Select
            label={t('vacancy_employment_type')}
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value as typeof employmentType)}
            className="select-auth"
            options={Object.entries(EMPLOYMENT_KEYS).map(([value, labelKey]) => ({
              value,
              label: t(labelKey),
            }))}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label={t('vacancy_salary_min')}
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              inputMode="numeric"
            />
            <Input
              label={t('vacancy_salary_max')}
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              inputMode="numeric"
            />
          </div>
          <label className="flex items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={publish}
              onChange={(e) => setPublish(e.target.checked)}
              className="h-4 w-4 accent-[var(--color-primary)]"
            />
            {t('vacancy_publish')}
          </label>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" loading={submitting} onClick={() => void submitVacancy()}>
              {t('confirm')}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              {t('cancel')}
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <LoadingBlock className="py-16" />
      ) : vacancies.length === 0 ? (
        <EmptyState icon={<Briefcase className="h-14 w-14" />} title={t('vacancies_empty')} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {vacancies.map((job) => (
            <Card key={job.id} className="p-5">
              <h3 className="font-semibold text-[var(--kwork-text)]">{job.title}</h3>
              <p className="mt-1 text-[12px] text-[var(--kwork-text-muted)]">
                {[job.region, employmentLabel(job.employment_type)].filter(Boolean).join(' · ')}
              </p>
              {job.description && (
                <p className="mt-2 line-clamp-3 text-[13px] text-[var(--kwork-text-sub)]">{job.description}</p>
              )}
              {(job.salary_min != null || job.salary_max != null) && (
                <p className="mt-3 text-sm font-semibold text-[var(--color-primary)]">
                  {job.salary_min != null ? formatPrice(job.salary_min) : '—'}
                  {job.salary_max != null ? ` – ${formatPrice(job.salary_max)}` : ''}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </PageWrapper>
  )
}
