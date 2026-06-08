'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { cn } from '@/shared/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export function Breadcrumb({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  const { t } = useApp()

  if (items.length === 0) return null

  return (
    <nav aria-label={t('breadcrumb_label')} className={cn('breadcrumb', className)}>
      <ol className="breadcrumb-list">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={`${item.label}-${i}`} className="breadcrumb-item">
              {i > 0 && <ChevronRight className="breadcrumb-sep" aria-hidden />}
              {item.href && !isLast ? (
                <Link href={item.href} className="breadcrumb-link">
                  {item.label}
                </Link>
              ) : (
                <span className={cn('breadcrumb-current', isLast && 'breadcrumb-current--active')}>
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
