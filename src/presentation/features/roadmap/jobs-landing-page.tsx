'use client'

import { useEffect, useState } from 'react'
import { RoadmapBanner } from '@/presentation/components/layout/roadmap-banner'
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

  return (
    <div>
      <div className="layout-container mx-auto max-w-[1140px] px-4 pt-5 md:pt-6">
        <RoadmapBanner
          titleKey="roadmap_jobs_title"
          descKey="roadmap_jobs_desc"
          waitlistSource="jobs"
        />
      </div>
      <ProjectsCatalog titleKey="jobs_catalog_title" subtitleKey="jobs_catalog_subtitle" />
    </div>
  )
}
