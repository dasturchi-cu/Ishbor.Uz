'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { PATHS } from '@/domain/constants/routes'
import { cn } from '@/shared/lib/utils'

const MAIN_LINKS = [
  {
    href: PATHS.services,
    labelKey: 'nav_services' as const,
    match: (p: string) => p === PATHS.services || p.startsWith(`${PATHS.services}/`),
  },
  {
    href: PATHS.freelancers,
    labelKey: 'nav_freelancers' as const,
    match: (p: string) => p.startsWith(PATHS.freelancers),
  },
  {
    href: PATHS.projects,
    labelKey: 'nav_project_marketplace' as const,
    match: (p: string) => p.startsWith(PATHS.projects) || p === PATHS.postProject,
  },
  {
    href: PATHS.jobs,
    labelKey: 'nav_jobs' as const,
    match: (p: string) => p === PATHS.jobs || p.startsWith(`${PATHS.jobs}/`),
  },
  {
    href: PATHS.companies,
    labelKey: 'nav_companies' as const,
    match: (p: string) => p === PATHS.companies || p.startsWith(`${PATHS.companies}/`),
  },
] as const

const INTERIOR_PREFIXES = ['/dashboard', '/onboarding', '/wallet', '/settings', '/notifications', '/messages', '/admin']

function isInteriorPage(pathname: string): boolean {
  return INTERIOR_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export function CategoryNav() {
  const { t } = useApp()
  const pathname = usePathname()
  const hideOnAuth = pathname === PATHS.login || pathname === PATHS.register
  if (hideOnAuth || isInteriorPage(pathname)) return null

  return (
    <nav
      className="border-b border-[var(--ishbor-border)] bg-[var(--neutral-0)]"
      aria-label={t('categories_title')}
    >
      <div className="layout-container max-w-[1280px]">
        <div className="flex min-h-[var(--ishbor-nav-h)] items-stretch overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {MAIN_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'mega-tab shrink-0',
                link.match(pathname) && 'mega-tab-active'
              )}
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
