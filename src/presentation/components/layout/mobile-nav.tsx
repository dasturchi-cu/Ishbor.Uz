'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Briefcase,
  MessageCircle,
  Package,
  Search,
  ShoppingBag,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { PATHS } from '@/domain/constants/routes'
import type { TranslationKey } from '@/infrastructure/i18n'
import { cn } from '@/shared/lib/utils'
import { useMessageUnreadCount } from '@/shared/lib/use-message-unread'

interface TabItem {
  id: string
  href: string
  labelKey: TranslationKey
  icon: LucideIcon
  isActive: (pathname: string) => boolean
  badge?: number
}

function isServiceCatalogPath(pathname: string): boolean {
  return (
    pathname === PATHS.services ||
    (pathname.startsWith('/services/') &&
      pathname !== PATHS.createService &&
      !pathname.startsWith(`${PATHS.createService}/`))
  )
}

function buildTabs(isClient: boolean, messageUnread: number): TabItem[] {
  const catalog: TabItem = {
    id: 'catalog',
    href: PATHS.services,
    labelKey: 'nav_services',
    icon: Search,
    isActive: isServiceCatalogPath,
  }

  const orders: TabItem = {
    id: 'orders',
    href: PATHS.dashboardOrders,
    labelKey: 'nav_orders',
    icon: ShoppingBag,
    isActive: (p) => p === PATHS.dashboardOrders || p.startsWith(`${PATHS.dashboardOrders}/`),
  }

  const birja: TabItem = {
    id: 'birja',
    href: isClient ? PATHS.postProject : PATHS.projects,
    labelKey: 'nav_birja',
    icon: Briefcase,
    isActive: (p) =>
      (isClient &&
        (p === PATHS.postProject || p.startsWith(`${PATHS.postProject}/`))) ||
      (!isClient && (p === PATHS.projects || p.startsWith(`${PATHS.projects}/`))),
  }

  const messages: TabItem = {
    id: 'messages',
    href: PATHS.dashboardMessages,
    labelKey: 'nav_messages',
    icon: MessageCircle,
    isActive: (p) => p === PATHS.dashboardMessages || p.startsWith(`${PATHS.dashboardMessages}/`),
    badge: messageUnread > 0 ? messageUnread : undefined,
  }

  if (isClient) {
    return [catalog, orders, birja, messages]
  }

  return [
    catalog,
    {
      id: 'my-services',
      href: PATHS.dashboardServices,
      labelKey: 'nav_my_services',
      icon: Package,
      isActive: (p) => p === PATHS.dashboardServices || p.startsWith(`${PATHS.dashboardServices}/`),
    },
    orders,
    birja,
    messages,
  ]
}

export function MobileNav() {
  const pathname = usePathname()
  const { t, isLoggedIn, isAuthLoading, currentUserRole, profile } = useApp()
  const messageUnread = useMessageUnreadCount(!!profile)

  const hideOnAuth = pathname === PATHS.login || pathname === PATHS.register
  if (hideOnAuth || isAuthLoading || !isLoggedIn) return null

  const isClient = currentUserRole === 'client'
  const tabs = buildTabs(isClient, messageUnread)

  return (
    <nav
      className="mobile-bottom-nav show-mobile"
      aria-label={t('nav_dashboard')}
    >
      <div className="mobile-bottom-nav-inner">
        {tabs.map(({ id, href, labelKey, icon: Icon, isActive, badge }) => {
          const active = isActive(pathname)
          return (
            <Link
              key={id}
              href={href}
              className={cn('mobile-bottom-nav-item', active && 'mobile-bottom-nav-item--active')}
            >
              <span className={cn('mobile-bottom-nav-icon relative', active && 'mobile-bottom-nav-icon--active')}>
                <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 2} />
                {badge != null && badge > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-[var(--error)] px-0.5 text-[9px] font-bold text-white">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </span>
              <span className="mobile-bottom-nav-label">{t(labelKey)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

/** @deprecated use MobileNav */
export { MobileNav as MobileBottomNav }
