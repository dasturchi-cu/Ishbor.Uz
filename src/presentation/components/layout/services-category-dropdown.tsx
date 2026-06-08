'use client'

import Link from 'next/link'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { PATHS } from '@/domain/constants/routes'
import {
  KWORK_CATEGORY_ITEMS,
  slugFromCategory,
} from '@/presentation/components/layout/category-icon-row'
import { cn } from '@/shared/lib/utils'

const CATEGORY_ACCENTS: Record<string, { bg: string; icon: string }> = {
  graphic: { bg: '#FDF2F8', icon: '#DB2777' },
  web: { bg: '#EFF6FF', icon: '#2563EB' },
  writing: { bg: '#F0FDF4', icon: '#16A34A' },
  seo: { bg: '#FFF7ED', icon: '#EA580C' },
  smm: { bg: '#F5F3FF', icon: '#7C3AED' },
  video: { bg: '#ECFEFF', icon: '#0891B2' },
  business: { bg: '#F1F5F9', icon: '#475569' },
}

export function ServicesCategoryDropdown({
  activeCategory,
  className,
}: {
  activeCategory?: string | null
  className?: string
}) {
  const { t } = useApp()
  const activeSlug = slugFromCategory(activeCategory ?? undefined)

  return (
    <div className={cn('services-cat-menu', className)}>
      <ul className="services-cat-menu-list">
        {KWORK_CATEGORY_ITEMS.map((item) => {
          const Icon = item.icon
          const accent = CATEGORY_ACCENTS[item.slug] ?? CATEGORY_ACCENTS.web
          const isActive = activeSlug === item.slug

          return (
            <li key={item.slug}>
              <Link
                href={`${PATHS.services}?cat=${item.cat}`}
                className={cn('services-cat-menu-link', isActive && 'services-cat-menu-link-active')}
              >
                <span
                  className="services-cat-menu-icon"
                  style={{ backgroundColor: accent.bg, color: accent.icon }}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                </span>
                {t(item.labelKey)}
              </Link>
            </li>
          )
        })}
      </ul>
      <Link href={PATHS.services} className="services-cat-menu-all">
        {t('view_all')}
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

export function ServicesCategoryTrigger({
  active,
  className,
}: {
  active?: boolean
  className?: string
}) {
  const { t } = useApp()

  return (
    <span className={cn('mega-tab inline-flex items-center gap-1.5', active && 'mega-tab-active', className)}>
      {t('nav_services')}
      <ChevronDown className="services-cat-chevron h-3.5 w-3.5" aria-hidden />
    </span>
  )
}
