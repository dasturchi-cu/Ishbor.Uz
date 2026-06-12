'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Briefcase, FolderKanban, Home, Users, Wrench } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { PATHS } from '@/domain/constants/routes'
import { cn } from '@/shared/lib/utils'

interface GuestTab {
  id: string
  href: string
  labelKey: 'nav_home' | 'nav_services' | 'nav_freelancers' | 'nav_projects' | 'jobs_nav_short'
  icon: LucideIcon
  isActive: (pathname: string) => boolean
}

const GUEST_TABS: GuestTab[] = [
  { id: 'home', href: PATHS.home, labelKey: 'nav_home', icon: Home, isActive: (p) => p === PATHS.home },
  {
    id: 'services',
    href: PATHS.services,
    labelKey: 'nav_services',
    icon: Wrench,
    isActive: (p) => p === PATHS.services || p.startsWith('/services/'),
  },
  {
    id: 'freelancers',
    href: PATHS.freelancers,
    labelKey: 'nav_freelancers',
    icon: Users,
    isActive: (p) => p === PATHS.freelancers || p.startsWith('/freelancers/') || p.startsWith('/freelancer/'),
  },
  {
    id: 'projects',
    href: PATHS.projects,
    labelKey: 'nav_projects',
    icon: FolderKanban,
    isActive: (p) => p === PATHS.projects || p.startsWith('/projects/'),
  },
  {
    id: 'jobs',
    href: PATHS.jobs,
    labelKey: 'jobs_nav_short',
    icon: Briefcase,
    isActive: (p) => p === PATHS.jobs || p.startsWith('/jobs/') || p === PATHS.companies || p.startsWith('/companies/'),
  },
]

export function GuestMobileNav() {
  const pathname = usePathname()
  const { t, isLoggedIn, isAuthLoading } = useApp()

  const hideOnAuth = pathname === PATHS.login || pathname === PATHS.register
  if (hideOnAuth || isAuthLoading || isLoggedIn) return null

  return (
    <nav className="mobile-bottom-nav guest-mobile-nav guest-mobile-nav--dense show-mobile" aria-label={t('nav_main_menu')}>
      <div className="mobile-bottom-nav-inner">
        {GUEST_TABS.map(({ id, href, labelKey, icon: Icon, isActive }) => {
          const active = isActive(pathname)
          return (
            <Link
              key={id}
              href={href}
              className={cn('mobile-bottom-nav-item', active && 'mobile-bottom-nav-item--active')}
            >
              <span className={cn('mobile-bottom-nav-icon', active && 'mobile-bottom-nav-icon--active')}>
                <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 2} />
              </span>
              <span className="mobile-bottom-nav-label">{t(labelKey)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
