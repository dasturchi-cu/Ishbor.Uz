'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { MarketplaceCatalogHero } from '@/presentation/components/layout/marketplace-catalog-hero'
import { MarketplaceDiscoverNav } from '@/presentation/components/layout/marketplace-discover-nav'
import { ProjectsCatalog } from '@/presentation/features/projects/projects-catalog'
import { VacanciesCatalog } from '@/presentation/features/vacancies/vacancies-catalog'
import { api } from '@/infrastructure/api/client'
import { ignoreWithLog } from '@/shared/lib/ignore-with-log'
import { PATHS } from '@/domain/constants/routes'
import { loginPath } from '@/shared/lib/auth-redirect'
import { toast } from '@/presentation/components/ui/toast'

function JobsProjectsHero() {
  const { t } = useApp()

  return (
    <MarketplaceCatalogHero
      badge={t('projects_hero_badge')}
      title={t('projects_hero_title')}
      subtitle={t('projects_hero_subtitle')}
      primaryAction={{
        label: t('projects_hero_browse'),
        onClick: () => document.getElementById('projects-catalog')?.scrollIntoView({ behavior: 'smooth' }),
      }}
      secondaryAction={{
        label: t('projects_hero_post'),
        href: PATHS.postProject,
      }}
      trustLine={t('projects_hero_trust')}
    />
  )
}

function JobsVacanciesHero() {
  const { t, isLoggedIn, currentUserRole } = useApp()
  const router = useRouter()

  const handlePostVacancy = () => {
    if (!isLoggedIn) {
      router.push(loginPath(PATHS.jobs))
      return
    }
    if (currentUserRole !== 'client') {
      toast.error(t('vacancy_client_only'))
      return
    }
    document.getElementById('jobs-catalog')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <MarketplaceCatalogHero
      badge={t('jobs_hero_badge')}
      title={t('jobs_hero_title')}
      subtitle={t('jobs_hero_subtitle')}
      primaryAction={{
        label: t('jobs_hero_browse'),
        onClick: () => document.getElementById('jobs-catalog')?.scrollIntoView({ behavior: 'smooth' }),
      }}
      secondaryAction={{
        label: t('jobs_hero_post'),
        onClick: handlePostVacancy,
      }}
      trustLine={t('jobs_hero_trust')}
    />
  )
}

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
    return (
      <>
        <JobsVacanciesHero />
        <div className="layout-container max-w-[1280px] pt-4 md:pt-6">
          <MarketplaceDiscoverNav active="jobs" />
        </div>
        <div id="jobs-catalog">
          <VacanciesCatalog hideHeader />
        </div>
      </>
    )
  }

  return (
    <>
      <JobsProjectsHero />
      <div className="layout-container max-w-[1280px] pt-4 md:pt-6">
        <MarketplaceDiscoverNav active="jobs" />
      </div>
      <ProjectsCatalog hideHeader titleKey="jobs_catalog_title" subtitleKey="jobs_catalog_subtitle" />
    </>
  )
}
