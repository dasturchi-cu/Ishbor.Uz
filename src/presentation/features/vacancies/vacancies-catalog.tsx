'use client'

import { useEffect, useState } from 'react'
import { Briefcase } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { api } from '@/infrastructure/api/client'
import type { ApiVacancy } from '@/infrastructure/api/types'
import { PageWrapper } from '@/presentation/components/layout/page-wrapper'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { LoadingBlock } from '@/presentation/components/ui/loading-block'
import { Card } from '@/presentation/components/ui/card'
import { formatPrice } from '@/shared/lib/format'

export function VacanciesCatalog() {
  const { t } = useApp()
  const [vacancies, setVacancies] = useState<ApiVacancy[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .listVacancies({ limit: 24 })
      .then(setVacancies)
      .catch(() => setVacancies([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <PageWrapper>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--kwork-text)]">{t('jobs_catalog_title')}</h1>
        <p className="mt-1 text-[14px] text-[var(--kwork-text-muted)]">{t('jobs_catalog_subtitle')}</p>
      </div>
      {loading ? (
        <LoadingBlock className="py-16" />
      ) : vacancies.length === 0 ? (
        <EmptyState icon={<Briefcase className="h-14 w-14" />} title={t('vacancies_empty')} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {vacancies.map((job) => (
            <Card key={job.id} className="p-5">
              <h3 className="font-semibold text-[var(--kwork-text)]">{job.title}</h3>
              {job.region && <p className="mt-1 text-[12px] text-[var(--kwork-text-muted)]">{job.region}</p>}
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
