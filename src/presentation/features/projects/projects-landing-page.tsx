'use client'

import { useApp } from '@/application/providers/app-provider'
import { MarketplaceCatalogHero } from '@/presentation/components/layout/marketplace-catalog-hero'
import { MarketplaceDiscoverNav } from '@/presentation/components/layout/marketplace-discover-nav'
import { TrustStrip } from '@/presentation/components/layout/trust-strip'
import { ProjectsCatalog } from '@/presentation/features/projects/projects-catalog'
import { PATHS } from '@/domain/constants/routes'

export function ProjectsLandingPage() {
  const { t } = useApp()

  return (
    <>
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
      <div className="layout-container max-w-[1280px] space-y-4 pt-4 md:pt-6">
        <MarketplaceDiscoverNav active="projects" />
        <TrustStrip />
      </div>
      <ProjectsCatalog hideHeader />
    </>
  )
}
