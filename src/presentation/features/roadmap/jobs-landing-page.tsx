'use client'

import { RoadmapBanner } from '@/presentation/components/layout/roadmap-banner'
import { ProjectsCatalog } from '@/presentation/features/projects/projects-catalog'

export function JobsLandingPage() {
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
