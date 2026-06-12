'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/application/providers/app-provider'
import '@/presentation/styles/route-catalog.css'
import { MarketplaceCatalogHero } from '@/presentation/components/layout/marketplace-catalog-hero'
import { MarketplaceDiscoverNav } from '@/presentation/components/layout/marketplace-discover-nav'
import { FreelancersCatalog } from '@/presentation/features/freelancers/freelancers-catalog'
import { CompaniesCatalog } from '@/presentation/features/companies/companies-catalog'
import { api } from '@/infrastructure/api/client'
import { ignoreWithLog } from '@/shared/lib/ignore-with-log'
import { PATHS } from '@/domain/constants/routes'

function CompaniesHero() {
  const { t } = useApp()

  return (
    <MarketplaceCatalogHero
      badge={t('companies_hero_badge')}
      title={t('companies_hero_title')}
      subtitle={t('companies_hero_subtitle')}
      primaryAction={{
        label: t('companies_hero_browse'),
        onClick: () => document.getElementById('companies-catalog')?.scrollIntoView({ behavior: 'smooth' }),
      }}
      secondaryAction={{
        label: t('companies_hero_hire'),
        href: PATHS.freelancers,
      }}
      trustLine={t('companies_hero_trust')}
    />
  )
}

export function CompaniesLandingPage() {
  const [companiesEnabled, setCompaniesEnabled] = useState(false)

  useEffect(() => {
    api
      .listFeatureFlags()
      .then((flags) => setCompaniesEnabled(flags.some((f) => f.key === 'companies' && f.enabled)))
      .catch((e) => {
        ignoreWithLog(e, { scope: 'generic', apiPath: '/api/v1/platform/feature-flags' })
        setCompaniesEnabled(false)
      })
  }, [])

  if (companiesEnabled) {
    return (
      <>
        <CompaniesHero />
        <div className="layout-container max-w-[1280px] pt-4 md:pt-6">
          <MarketplaceDiscoverNav />
        </div>
        <div id="companies-catalog">
          <CompaniesCatalog hideHeader />
        </div>
      </>
    )
  }

  return (
    <>
      <CompaniesHero />
      <div className="layout-container max-w-[1280px] pt-4 md:pt-6">
        <MarketplaceDiscoverNav />
      </div>
      <FreelancersCatalog hideHeader titleKey="companies_catalog_title" subtitleKey="companies_catalog_subtitle" />
    </>
  )
}
