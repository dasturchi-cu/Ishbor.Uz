'use client'

import { useEffect, useState } from 'react'
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
    <FreelancersCatalog
      titleKey="companies_catalog_title"
      subtitleKey="companies_catalog_subtitle"
    />
  )
}
