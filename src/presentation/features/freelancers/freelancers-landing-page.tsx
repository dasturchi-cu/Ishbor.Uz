'use client'

import '@/presentation/styles/route-catalog.css'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { MarketplaceCatalogHero } from '@/presentation/components/layout/marketplace-catalog-hero'
import { MarketplaceDiscoverNav } from '@/presentation/components/layout/marketplace-discover-nav'
import { FreelancersCatalog } from '@/presentation/features/freelancers/freelancers-catalog'
import { PATHS } from '@/domain/constants/routes'
import { loginPath } from '@/shared/lib/auth-redirect'

export function FreelancersLandingPage() {
  const { t, isLoggedIn } = useApp()
  const router = useRouter()

  const handleBecomeFreelancer = () => {
    if (!isLoggedIn) {
      router.push(loginPath(PATHS.register))
      return
    }
    router.push(PATHS.dashboardFreelancer)
  }

  return (
    <>
      <MarketplaceCatalogHero
        badge={t('freelancers_hero_badge')}
        title={t('freelancers_hero_title')}
        subtitle={t('freelancers_hero_subtitle')}
        primaryAction={{
          label: t('freelancers_hero_browse'),
          onClick: () => document.getElementById('freelancers-catalog')?.scrollIntoView({ behavior: 'smooth' }),
        }}
        secondaryAction={{
          label: t('freelancers_hero_cta'),
          onClick: handleBecomeFreelancer,
        }}
        trustLine={t('freelancers_hero_trust')}
      />
      <div className="layout-container max-w-[1280px] pt-4 md:pt-6">
        <MarketplaceDiscoverNav active="freelancers" />
      </div>
      <FreelancersCatalog hideHeader />
    </>
  )
}
