'use client'

import { useEffect, useState } from 'react'
import { RoadmapBanner } from '@/presentation/components/layout/roadmap-banner'
import { FreelancersCatalog } from '@/presentation/features/freelancers/freelancers-catalog'
import { CompaniesCatalog } from '@/presentation/features/companies/companies-catalog'
import { api } from '@/infrastructure/api/client'

export function CompaniesLandingPage() {
  const [companiesEnabled, setCompaniesEnabled] = useState(false)

  useEffect(() => {
    api
      .listFeatureFlags()
      .then((flags) => setCompaniesEnabled(flags.some((f) => f.key === 'companies' && f.enabled)))
      .catch(() => setCompaniesEnabled(false))
  }, [])

  if (companiesEnabled) {
    return <CompaniesCatalog />
  }

  return (
    <div>
      <div className="layout-container mx-auto max-w-[1140px] px-4 pt-5 md:pt-6">
        <RoadmapBanner
          titleKey="roadmap_companies_title"
          descKey="roadmap_companies_desc"
          waitlistSource="companies"
        />
      </div>
      <FreelancersCatalog
        titleKey="companies_catalog_title"
        subtitleKey="companies_catalog_subtitle"
      />
    </div>
  )
}
