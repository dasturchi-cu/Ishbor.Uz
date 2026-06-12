'use client'

import Link from 'next/link'
import { Briefcase, FolderKanban, Users, Wrench } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { PATHS } from '@/domain/constants/routes'
import type { TranslationKey } from '@/infrastructure/i18n'
import { cn } from '@/shared/lib/utils'

export type MarketplaceDiscoverSurface = 'services' | 'freelancers' | 'projects' | 'jobs'

type DiscoverItem = {
  id: MarketplaceDiscoverSurface
  href: string
  labelKey: TranslationKey
  icon: LucideIcon
}

const DISCOVER_ITEMS: DiscoverItem[] = [
  { id: 'services', href: PATHS.services, labelKey: 'nav_services', icon: Wrench },
  { id: 'freelancers', href: PATHS.freelancers, labelKey: 'nav_freelancers', icon: Users },
  { id: 'projects', href: PATHS.projects, labelKey: 'nav_projects', icon: FolderKanban },
  { id: 'jobs', href: PATHS.jobs, labelKey: 'jobs_catalog_title', icon: Briefcase },
]

export function MarketplaceDiscoverNav({
  active,
  className,
}: {
  /** Omit on home — no tab highlighted */
  active?: MarketplaceDiscoverSurface
  className?: string
}) {
  const { t } = useApp()

  return (
    <div className="discover-nav-scroll">
      <nav className={cn('jobs-discover-nav', className)} aria-label={t('marketplace_discover_nav')}>
        {DISCOVER_ITEMS.map(({ id, href, labelKey, icon: Icon }) => (
          <Link
            key={id}
            href={href}
            className={cn('jobs-discover-nav__item', active === id && 'jobs-discover-nav__item--active')}
            aria-current={active === id ? 'page' : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {t(labelKey)}
          </Link>
        ))}
      </nav>
    </div>
  )
}
