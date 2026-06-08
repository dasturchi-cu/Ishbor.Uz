'use client'

import { RoadmapBanner } from '@/presentation/components/layout/roadmap-banner'
import { FreelancersCatalog } from '@/presentation/features/freelancers/freelancers-catalog'

export function CompaniesLandingPage() {
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
