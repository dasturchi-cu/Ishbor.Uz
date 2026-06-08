'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { PATHS } from '@/domain/constants/routes'
import {
  ServicesCategoryDropdown,
  ServicesCategoryTrigger,
} from '@/presentation/components/layout/services-category-dropdown'
import { cn } from '@/shared/lib/utils'
import { KWORK_CATEGORY_ITEMS } from '@/presentation/components/layout/category-icon-row'

const MAIN_LINKS = [
  {
    href: PATHS.freelancers,
    labelKey: 'nav_freelancers' as const,
    match: (p: string) => p.startsWith(PATHS.freelancers),
  },
  {
    href: PATHS.projects,
    labelKey: 'nav_projects' as const,
    match: (p: string) => p.startsWith(PATHS.projects) || p === PATHS.postProject,
  },
  { href: PATHS.blog, labelKey: 'nav_blog' as const, match: (p: string) => p.startsWith(PATHS.blog) },
  { href: PATHS.pricing, labelKey: 'nav_pricing' as const, match: (p: string) => p === PATHS.pricing },
] as const

const INTERIOR_PREFIXES = ['/dashboard', '/onboarding', '/wallet', '/settings', '/notifications', '/messages', '/admin']

function isInteriorPage(pathname: string): boolean {
  return INTERIOR_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export function CategoryNav() {
  const { t } = useApp()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeCat = searchParams.get('cat')
  const hideOnAuth = pathname === PATHS.login || pathname === PATHS.register
  if (hideOnAuth || isInteriorPage(pathname)) return null

  const onServices = pathname === PATHS.services || pathname.startsWith(`${PATHS.services}/`)

  return (
    <>
    <nav
      className="show-mobile border-b border-[var(--kwork-border)] bg-[var(--neutral-0)]"
      aria-label={t('categories_title')}
    >
      <div className="layout-container max-w-[1280px]">
        <div className="flex gap-2 overflow-x-auto px-4 py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {KWORK_CATEGORY_ITEMS.map((item) => (
            <Link
              key={item.cat}
              href={`${PATHS.services}?cat=${item.cat}`}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-medium transition',
                activeCat === item.cat
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                  : 'border-[var(--kwork-border)] bg-[var(--neutral-0)] text-[var(--kwork-text-muted)]'
              )}
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </div>
      </div>
    </nav>
    <nav
      className="hide-mobile relative border-b border-[var(--kwork-border)] bg-[var(--neutral-0)]"
      aria-label={t('categories_title')}
    >
      <div className="layout-container max-w-[1280px]">
        <div className="flex min-h-[var(--kwork-nav-h)] items-stretch">
          <div className="flex min-w-0 flex-1 items-stretch overflow-x-auto">
            <div className="group static shrink-0 border-r border-[var(--kwork-border)]">
              <Link
                href={PATHS.services}
                className="block h-full"
                aria-haspopup="true"
              >
                <ServicesCategoryTrigger active={onServices} />
              </Link>

              <div className="services-cat-dropdown-bridge pointer-events-none absolute left-0 top-full z-50 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100">
                <div className="px-4 pb-4 pt-2 sm:px-5">
                  <ServicesCategoryDropdown activeCategory={activeCat} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-stretch pl-2">
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
      </div>
    </nav>
    </>
  )
}
