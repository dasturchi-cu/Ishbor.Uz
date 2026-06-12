'use client'

import '@/presentation/styles/route-catalog.css'
import { useApp } from '@/application/providers/app-provider'
import { MarketplaceCatalogHero } from '@/presentation/components/layout/marketplace-catalog-hero'
import { IshborProtectionStrip } from '@/presentation/components/layout/ishbor-protection-strip'
import { MarketplaceDiscoverNav } from '@/presentation/components/layout/marketplace-discover-nav'
import { PATHS } from '@/domain/constants/routes'
import { loginPath, registerPath } from '@/shared/lib/auth-redirect'

const RETURN_TO = PATHS.postProject

export function PostProjectGuestPage() {
  const { t } = useApp()

  return (
    <div className="min-h-[calc(100dvh-var(--ishbor-header-h))] bg-[var(--body-bg)]">
      <MarketplaceCatalogHero
        badge={t('post_project_guest_badge')}
        title={t('post_project_guest_title')}
        subtitle={t('post_project_guest_subtitle')}
        primaryAction={{
          label: t('post_project_guest_cta'),
          href: registerPath(RETURN_TO),
        }}
        secondaryAction={{
          label: t('login'),
          href: loginPath(RETURN_TO),
        }}
        trustLine={t('projects_hero_trust')}
      />
      <div className="layout-container max-w-[1280px] space-y-6 pb-10 pt-4 md:pt-6">
        <MarketplaceDiscoverNav active="projects" />
        <IshborProtectionStrip />
        <p className="text-center text-[14px] text-[var(--ishbor-text-muted)]">
          {t('post_project_guest_hint')}
        </p>
      </div>
    </div>
  )
}
