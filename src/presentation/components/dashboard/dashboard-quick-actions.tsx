'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'

export interface QuickActionItem {
  href: string
  icon: LucideIcon
  labelKey: string
}

export function DashboardQuickActions({ items }: { items: QuickActionItem[] }) {
  const { t } = useApp()

  return (
    <div className="dash-quick">
      <p className="dash-quick__label">{t('quick_actions_title')}</p>
      <div className="dash-quick__grid">
        {items.map(({ href, icon: Icon, labelKey }) => (
          <Link key={href} href={href} className="dash-quick__card">
            <span className="dash-quick__icon">
              <Icon className="h-4 w-4" />
            </span>
            <span className="dash-quick__text">{t(labelKey as never)}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
