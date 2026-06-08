'use client'

import Link from 'next/link'
import { useApp } from '@/application/providers/app-provider'
import { PATHS } from '@/domain/constants/routes'
import {
  splitMegaColumns,
  type ServiceMegaCategory,
} from '@/domain/constants/service-categories'

interface ServicesMegaMenuProps {
  category: ServiceMegaCategory
}

export function ServicesMegaMenu({ category }: ServicesMegaMenuProps) {
  const { t } = useApp()
  const [left, right] = splitMegaColumns(category.subcategories)

  return (
    <div className="mega-menu-panel">
      <p className="mega-menu-title">{t(category.labelKey)}</p>
      <div className="mega-menu-columns">
        <ul className="mega-menu-list">
          {left.map((sub) => (
            <li key={sub.labelKey}>
              <Link href={`${PATHS.services}?cat=${sub.cat}`} className="mega-menu-link">
                {t(sub.labelKey)}
              </Link>
            </li>
          ))}
        </ul>
        <ul className="mega-menu-list mega-menu-list-divider">
          {right.map((sub) => (
            <li key={sub.labelKey}>
              <Link href={`${PATHS.services}?cat=${sub.cat}`} className="mega-menu-link">
                {t(sub.labelKey)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <Link href={`${PATHS.services}?cat=${category.cat}`} className="mega-menu-all">
        {t('view_all')} →
      </Link>
    </div>
  )
}
