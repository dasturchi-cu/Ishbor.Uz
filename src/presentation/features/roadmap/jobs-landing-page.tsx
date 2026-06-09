'use client'

import { useEffect, useState } from 'react'
import { ProjectsCatalog } from '@/presentation/features/projects/projects-catalog'
import { VacanciesCatalog } from '@/presentation/features/vacancies/vacancies-catalog'
import { api } from '@/infrastructure/api/client'

export function JobsLandingPage() {
  const [vacanciesEnabled, setVacanciesEnabled] = useState(false)

  useEffect(() => {
    api
      .listFeatureFlags()
      .then((flags) => setVacanciesEnabled(flags.some((f) => f.key === 'vacancies' && f.enabled)))
      .catch(() => setVacanciesEnabled(false))
  }, [])

  if (vacanciesEnabled) {
    return <VacanciesCatalog />
  }

  return <ProjectsCatalog titleKey="jobs_catalog_title" subtitleKey="jobs_catalog_subtitle" />
}
