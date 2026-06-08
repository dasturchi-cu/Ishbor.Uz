'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Briefcase,
  MessageCircle,
  Package,
  Search,
  Shield,
  ShoppingBag,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { PATHS } from '@/domain/constants/routes'
import type { TranslationKey } from '@/infrastructure/i18n'
import { cn } from '@/shared/lib/utils'
import { useMessageUnreadCount } from '@/shared/lib/use-message-unread'

interface AuthNavItem {
  href: string
  labelKey: TranslationKey
  icon: LucideIcon
  match: (pathname: string) => boolean
  freelancerOnly?: boolean
  clientOnly?: boolean
}

function isServiceCatalogPath(pathname: string): boolean {
  return (
    pathname === PATHS.services ||
    (pathname.startsWith('/services/') &&
      pathname !== PATHS.createService &&
      !pathname.startsWith(`${PATHS.createService}/`))
  )
}

const AUTH_NAV: AuthNavItem[] = [
  {
    href: PATHS.services,
    labelKey: 'nav_services',
    icon: Search,
    match: isServiceCatalogPath,
  },
  {
    href: PATHS.dashboardServices,
    labelKey: 'nav_my_services',
    icon: Package,
    match: (p) => p === PATHS.dashboardServices || p.startsWith(`${PATHS.dashboardServices}/`),
    freelancerOnly: true,
  },
  {
    href: PATHS.dashboardOrders,
    labelKey: 'nav_orders',
    icon: ShoppingBag,
    match: (p) => p === PATHS.dashboardOrders || p.startsWith(`${PATHS.dashboardOrders}/`),
  },
  {
    href: PATHS.postProject,
    labelKey: 'nav_birja',
    icon: Briefcase,
    match: (p) =>
      p === PATHS.postProject ||
      p.startsWith(`${PATHS.postProject}/`) ||
      p === PATHS.projects ||
      p.startsWith(`${PATHS.projects}/`),
  },
  {
    href: PATHS.dashboardMessages,
    labelKey: 'nav_messages',
    icon: MessageCircle,
    match: (p) => p === PATHS.dashboardMessages || p.startsWith(`${PATHS.dashboardMessages}/`),
  },
]

export function AuthenticatedNav({ className }: { className?: string }) {
  const pathname = usePathname()
  const { t, currentUserRole, profile } = useApp()
  const messageUnread = useMessageUnreadCount(!!profile)
  const isClient = currentUserRole === 'client'

  const items = AUTH_NAV.filter((item) => {
    if (item.freelancerOnly && isClient) return false
    if (item.clientOnly && !isClient) return false
    return true
  })

  const adminActive = pathname === PATHS.admin || pathname.startsWith(`${PATHS.admin}/`)

  const linkClass = (active: boolean) =>
    cn(
      'auth-nav-link inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-[13px] font-semibold no-underline transition-all duration-200',
      active
        ? 'auth-nav-link--active border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-[0_4px_14px_rgba(37,99,235,0.35)]'
        : 'border-[var(--kwork-border)] bg-[var(--neutral-0)] text-[var(--kwork-text)] shadow-[var(--shadow-xs)] hover:border-[color-mix(in_srgb,var(--color-primary)_35%,var(--kwork-border))] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)]'
    )

  return (
    <nav className={cn('auth-nav w-full', className)} aria-label={t('nav_dashboard')}>
      <div className="auth-nav__track flex items-center gap-2.5 overflow-x-auto pb-0.5">
        {items.map((item) => {
          const active = item.match(pathname)
          const badge = item.labelKey === 'nav_messages' ? messageUnread : 0
          const Icon = item.icon
          return (
            <Link
              key={item.href + item.labelKey}
              href={item.href}
              className={linkClass(active)}
            >
              <Icon
                className={cn('h-4 w-4 shrink-0', active ? 'text-white' : 'text-[var(--color-primary)]')}
                strokeWidth={2.25}
                aria-hidden
              />
              <span>{t(item.labelKey)}</span>
              {badge > 0 && (
                <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--error)] px-1 text-[10px] font-bold text-white">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </Link>
          )
        })}
        {profile?.is_admin && (
          <Link href={PATHS.admin} className={linkClass(adminActive)}>
            <Shield
              className={cn('h-4 w-4 shrink-0', adminActive ? 'text-white' : 'text-[var(--color-primary)]')}
              strokeWidth={2.25}
              aria-hidden
            />
            <span>{t('admin_panel')}</span>
          </Link>
        )}
      </div>
    </nav>
  )
}
