'use client'

import Link from 'next/link'
import { ChevronRight, User, ShieldCheck, Plus, CreditCard, MessageCircle } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { PATHS } from '@/domain/constants/routes'
import { profileCompletionPercent } from '@/shared/lib/profile-completion'
import type { ApiOrder, ApiProject, ApiService } from '@/infrastructure/api/types'
import type { TranslationKey } from '@/infrastructure/i18n'

interface RecommendedItem {
  id: string
  icon: typeof User
  titleKey: TranslationKey
  descKey: TranslationKey
  href: string
  priority: number
}

interface DashboardRecommendedActionsProps {
  role: 'freelancer' | 'client'
  services: ApiService[]
  projects: ApiProject[]
  orders: ApiOrder[]
  messageUnread: number
}

export function DashboardRecommendedActions({
  role,
  services,
  projects,
  orders,
  messageUnread,
}: DashboardRecommendedActionsProps) {
  const { t, profile } = useApp()
  const completion = profileCompletionPercent(profile, role)
  const unpaid = orders.filter((o) => o.status === 'pending' && o.payment_status !== 'held')

  const items: RecommendedItem[] = []

  if (completion < 100) {
    items.push({
      id: 'profile',
      icon: User,
      titleKey: 'dash_rec_complete_profile',
      descKey: 'dash_rec_complete_profile_desc',
      href: PATHS.dashboardProfile,
      priority: 10,
    })
  }

  if (!profile?.is_verified) {
    items.push({
      id: 'verify',
      icon: ShieldCheck,
      titleKey: 'dash_rec_verify',
      descKey: 'dash_rec_verify_desc',
      href: PATHS.dashboardSettings,
      priority: 9,
    })
  }

  if (role === 'freelancer' && services.length === 0) {
    items.push({
      id: 'service',
      icon: Plus,
      titleKey: 'dash_rec_first_service',
      descKey: 'dash_rec_first_service_desc',
      href: PATHS.dashboardServicesNew,
      priority: 8,
    })
  }

  if (role === 'client' && projects.length === 0) {
    items.push({
      id: 'project',
      icon: Plus,
      titleKey: 'dash_rec_first_project',
      descKey: 'dash_rec_first_project_desc',
      href: PATHS.postProject,
      priority: 8,
    })
  }

  if (unpaid.length > 0) {
    items.push({
      id: 'pay',
      icon: CreditCard,
      titleKey: 'dash_rec_pay_order',
      descKey: 'dash_rec_pay_order_desc',
      href: PATHS.dashboardOrders,
      priority: 7,
    })
  }

  if (messageUnread > 0) {
    items.push({
      id: 'chat',
      icon: MessageCircle,
      titleKey: 'dash_rec_reply_messages',
      descKey: 'dash_rec_reply_messages_desc',
      href: PATHS.dashboardMessages,
      priority: 6,
    })
  }

  const visible = items.sort((a, b) => b.priority - a.priority).slice(0, 4)
  if (visible.length === 0) return null

  return (
    <section className="dash-rec">
      <h2 className="dash-rec__title">{t('dash_recommended_title')}</h2>
      <ul className="dash-rec__list">
        {visible.map((item) => {
          const Icon = item.icon
          return (
            <li key={item.id}>
              <Link href={item.href} className="dash-rec__item">
                <span className="dash-rec__icon">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="dash-rec__item-title">{t(item.titleKey)}</span>
                  <span className="dash-rec__item-desc">{t(item.descKey)}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-[var(--kwork-text-muted)]" />
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
