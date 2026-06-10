'use client'

import '@/presentation/styles/route-catalog.css'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { MarketplaceCatalogHero } from '@/presentation/components/layout/marketplace-catalog-hero'
import { MarketplaceDiscoverNav } from '@/presentation/components/layout/marketplace-discover-nav'
import { TrustStrip } from '@/presentation/components/layout/trust-strip'
import { ServicesCatalog } from '@/presentation/features/catalog/services-catalog'
import { PATHS } from '@/domain/constants/routes'
import { loginPath } from '@/shared/lib/auth-redirect'

export function ServicesLandingPage() {
  const { t, isLoggedIn, currentUserRole } = useApp()
  const router = useRouter()

  const handleCreateService = () => {
    if (!isLoggedIn) {
      router.push(loginPath(PATHS.createService))
      return
    }
    if (currentUserRole !== 'freelancer') {
      router.push(PATHS.dashboardFreelancer)
      return
    }
    router.push(PATHS.createService)
  }

  return (
    <>
      <MarketplaceCatalogHero
        badge={t('services_hero_badge')}
        title={t('services_hero_title')}
        subtitle={t('services_hero_subtitle')}
        primaryAction={{
          label: t('services_hero_browse'),
          onClick: () => document.getElementById('services-catalog')?.scrollIntoView({ behavior: 'smooth' }),
        }}
        secondaryAction={{
          label: t('services_hero_create'),
          onClick: handleCreateService,
        }}
        trustLine={t('services_hero_trust')}
      />
      <div className="layout-container max-w-[1280px] space-y-4 pt-4 md:pt-6">
        <MarketplaceDiscoverNav active="services" />
        <TrustStrip />
      </div>
      <ServicesCatalog hideHeader />
    </>
  )
}
