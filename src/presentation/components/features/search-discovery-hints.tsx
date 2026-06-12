'use client'

import Link from 'next/link'
import { useApp } from '@/application/providers/app-provider'
import { PATHS } from '@/domain/constants/routes'
import type { TranslationKey } from '@/infrastructure/i18n'
import { categoryHintsForQuery } from '@/shared/lib/search-category-hints'
import { cn } from '@/shared/lib/utils'

const CATEGORY_LABEL_KEYS: Record<string, TranslationKey> = {
  web: 'cat_web',
  mobile: 'cat_mobile',
  uiux: 'cat_uiux',
  graphic: 'cat_graphic',
  writing: 'cat_writing',
  video: 'cat_video',
  seo: 'cat_seo',
  smm: 'kwork_cat_smm',
}

export function SearchDiscoveryHints({
  query,
  className,
}: {
  query: string
  className?: string
}) {
  const { t } = useApp()
  const trimmed = query.trim()
  if (!trimmed) return null

  const categories = categoryHintsForQuery(trimmed)
  const encoded = encodeURIComponent(trimmed)

  return (
    <div className={cn('search-discovery-hints', className)}>
      <p className="search-discovery-hints__title">{t('search_discovery_title')}</p>
      <div className="search-discovery-hints__links">
        <Link href={`${PATHS.freelancers}?q=${encoded}`} className="search-discovery-hints__link">
          {t('search_discovery_freelancers')}
        </Link>
        <Link href={`${PATHS.projects}?q=${encoded}`} className="search-discovery-hints__link">
          {t('search_discovery_projects')}
        </Link>
      </div>
      {categories.length > 0 ? (
        <div className="search-discovery-hints__categories">
          <p className="search-discovery-hints__subtitle">{t('search_discovery_categories')}</p>
          <div className="search-discovery-hints__chips">
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`${PATHS.services}?cat=${cat}&q=${encoded}`}
                className="search-discovery-hints__chip"
              >
                {t(CATEGORY_LABEL_KEYS[cat] ?? 'cat_all')}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
