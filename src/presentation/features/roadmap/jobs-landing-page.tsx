'use client'

import { useEffect, useState } from 'react'
import { ProjectsCatalog } from '@/presentation/features/projects/projects-catalog'
import { VacanciesCatalog } from '@/presentation/features/vacancies/vacancies-catalog'
import { api } from '@/infrastructure/api/client'
import { ignoreWithLog } from '@/shared/lib/ignore-with-log'

export function JobsLandingPage() {
  const [vacanciesEnabled, setVacanciesEnabled] = useState(false)

  useEffect(() => {
    api
      .listFeatureFlags()
      .then((flags) => setVacanciesEnabled(flags.some((f) => f.key === 'vacancies' && f.enabled)))
      .catch((e) => {
        ignoreWithLog(e, { scope: 'generic', apiPath: '/api/v1/platform/feature-flags' })
        setVacanciesEnabled(false)
      })
  }, [])

  if (vacanciesEnabled) {
    return <VacanciesCatalog />
  }

  return <ProjectsCatalog titleKey="jobs_catalog_title" subtitleKey="jobs_catalog_subtitle" />
}
