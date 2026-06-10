'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Briefcase, Users, Wrench } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { MarketplaceCatalogHero } from '@/presentation/components/layout/marketplace-catalog-hero'
import { ProjectsCatalog } from '@/presentation/features/projects/projects-catalog'
import { VacanciesCatalog } from '@/presentation/features/vacancies/vacancies-catalog'
import { api } from '@/infrastructure/api/client'
import { ignoreWithLog } from '@/shared/lib/ignore-with-log'
import { PATHS } from '@/domain/constants/routes'
import { loginPath } from '@/shared/lib/auth-redirect'
import { cn } from '@/shared/lib/utils'
import { toast } from '@/presentation/components/ui/toast'

function JobsDiscoverNav() {
  const { t } = useApp()

  const links = [
    { href: PATHS.jobs, label: t('jobs_catalog_title'), icon: Briefcase, active: true },
    { href: PATHS.services, label: t('jobs_discover_services'), icon: Wrench, active: false },
    { href: PATHS.freelancers, label: t('jobs_discover_freelancers'), icon: Users, active: false },
  ]

  return (
    <nav className="jobs-discover-nav" aria-label={t('jobs_catalog_title')}>
      {links.map(({ href, label, icon: Icon, active }) => (
        <Link
          key={href}
          href={href}
          className={cn('jobs-discover-nav__item', active && 'jobs-discover-nav__item--active')}
          aria-current={active ? 'page' : undefined}
        >
          <Icon className="h-4 w-4 shrink-0" aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
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
          <JobsDiscoverNav />
        </div>
        <div id="jobs-catalog">
          <VacanciesCatalog hideHeader />
        </div>
      </>
    )
  }

  return (
    <>
      <div className="layout-container max-w-[1280px] pt-6 md:pt-8">
        <JobsDiscoverNav />
      </div>
      <ProjectsCatalog titleKey="jobs_catalog_title" subtitleKey="jobs_catalog_subtitle" />
    </>
  )
}
