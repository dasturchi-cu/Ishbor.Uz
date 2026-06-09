'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Package,
  FileText,
  Briefcase,
  ShoppingBag,
  Wallet,
  Settings,
  LogOut,
  LayoutDashboard,
  MessageCircle,
  Star,
  BarChart3,
  Bookmark,
  CreditCard,
  Search,
  HelpCircle,
  Menu,
  X,
  User,
  Shield,
  Bell,
  Landmark,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { useDashboardRole } from '@/presentation/components/auth/role-guard'
import { Avatar } from '@/presentation/components/ui/avatar'
import { Button } from '@/presentation/components/ui/button'
import { PATHS } from '@/domain/constants/routes'
import { profileCompletionPercent } from '@/shared/lib/profile-completion'
import { cn } from '@/shared/lib/utils'
import { useEscapeClose } from '@/shared/lib/use-escape-close'
import { useFocusTrap } from '@/shared/lib/use-focus-trap'
import { useBodyScrollLock } from '@/shared/lib/use-body-scroll-lock'
import { useMessageUnreadCount } from '@/shared/lib/use-message-unread'
import { useNotificationUnreadCount } from '@/shared/lib/use-notification-unread'
import { useAdminDeniedToast } from '@/shared/lib/use-admin-denied-toast'
import { VerifyEmailBanner } from '@/presentation/components/dashboard/verify-email-banner'
import type { TranslationKey } from '@/infrastructure/i18n'
import { formatDashboardHeaderDate } from '@/shared/lib/format-date'

interface NavItem {
  id: string
  href: string
  labelKey: TranslationKey
  icon: LucideIcon
  badge?: number
  freelancerOnly?: boolean
  clientOnly?: boolean
}

interface NavSection {
  titleKey: TranslationKey
  items: NavItem[]
}

const FREELANCER_SECTIONS: NavSection[] = [
  {
    titleKey: 'nav_section_main',
    items: [
      { id: 'home', href: PATHS.dashboardFreelancer, labelKey: 'nav_dashboard', icon: LayoutDashboard },
      { id: 'services', href: PATHS.dashboardServices, labelKey: 'nav_my_services', icon: Package, freelancerOnly: true },
      { id: 'orders', href: PATHS.dashboardOrders, labelKey: 'nav_orders', icon: ShoppingBag },
      { id: 'projects', href: PATHS.projects, labelKey: 'nav_projects', icon: Briefcase, freelancerOnly: true },
      { id: 'applications', href: PATHS.dashboardApplications, labelKey: 'nav_applications', icon: FileText, freelancerOnly: true },
    ],
  },
  {
    titleKey: 'nav_section_communication',
    items: [
      { id: 'messages', href: PATHS.dashboardMessages, labelKey: 'nav_messages', icon: MessageCircle },
      { id: 'notifications', href: PATHS.notifications, labelKey: 'nav_notifications', icon: Bell },
    ],
  },
  {
    titleKey: 'nav_section_finance',
    items: [
      { id: 'wallet', href: PATHS.dashboardWallet, labelKey: 'nav_wallet', icon: Wallet },
      { id: 'escrow', href: PATHS.dashboardEscrow, labelKey: 'nav_escrow', icon: Landmark },
      { id: 'reviews', href: PATHS.dashboardReviews, labelKey: 'nav_reviews', icon: Star, freelancerOnly: true },
      { id: 'analytics', href: PATHS.dashboardAnalytics, labelKey: 'nav_analytics', icon: BarChart3, freelancerOnly: true },
    ],
  },
  {
    titleKey: 'nav_section_account',
    items: [
      { id: 'saved', href: PATHS.dashboardSaved, labelKey: 'nav_saved', icon: Bookmark },
      { id: 'profile', href: PATHS.dashboardProfile, labelKey: 'nav_profile', icon: User },
      { id: 'settings', href: PATHS.dashboardSettings, labelKey: 'nav_settings', icon: Settings },
    ],
  },
]

const CLIENT_SECTIONS: NavSection[] = [
  {
    titleKey: 'nav_section_main',
    items: [
      { id: 'home', href: PATHS.dashboardClient, labelKey: 'nav_dashboard', icon: LayoutDashboard },
      { id: 'projects', href: PATHS.dashboardProjects, labelKey: 'nav_my_projects', icon: Briefcase, clientOnly: true },
      { id: 'orders', href: PATHS.dashboardOrders, labelKey: 'nav_orders', icon: ShoppingBag },
      { id: 'find', href: PATHS.services, labelKey: 'nav_find_freelancers', icon: Search, clientOnly: true },
    ],
  },
  {
    titleKey: 'nav_section_communication',
    items: [
      { id: 'messages', href: PATHS.dashboardMessages, labelKey: 'nav_messages', icon: MessageCircle },
      { id: 'notifications', href: PATHS.notifications, labelKey: 'nav_notifications', icon: Bell },
    ],
  },
  {
    titleKey: 'nav_section_finance',
    items: [
      { id: 'payments', href: PATHS.dashboardPayments, labelKey: 'nav_payments', icon: CreditCard, clientOnly: true },
      { id: 'wallet', href: PATHS.dashboardWallet, labelKey: 'nav_wallet', icon: Wallet },
      { id: 'escrow', href: PATHS.dashboardEscrow, labelKey: 'nav_escrow', icon: Landmark },
      { id: 'reviews', href: PATHS.dashboardReviews, labelKey: 'nav_reviews', icon: Star },
      { id: 'analytics', href: PATHS.dashboardAnalytics, labelKey: 'nav_analytics', icon: BarChart3 },
    ],
  },
  {
    titleKey: 'nav_section_account',
    items: [
      { id: 'saved', href: PATHS.dashboardSaved, labelKey: 'nav_saved', icon: Bookmark, clientOnly: true },
      { id: 'profile', href: PATHS.dashboardProfile, labelKey: 'nav_profile', icon: User },
      { id: 'settings', href: PATHS.dashboardSettings, labelKey: 'nav_settings', icon: Settings },
    ],
  },
]

const PAGE_TITLES: Record<string, TranslationKey> = {
  [PATHS.dashboardFreelancer]: 'nav_dashboard',
  [PATHS.dashboardClient]: 'nav_dashboard',
  [PATHS.dashboardServices]: 'nav_my_services',
  [PATHS.dashboardServicesNew]: 'nav_new_service',
  [PATHS.dashboardProjects]: 'nav_my_projects',
  [PATHS.dashboardApplications]: 'nav_applications',
  [PATHS.dashboardOrders]: 'nav_orders',
  [PATHS.dashboardMessages]: 'nav_messages',
  [PATHS.dashboardReviews]: 'nav_reviews',
  [PATHS.dashboardAnalytics]: 'nav_analytics',
  [PATHS.dashboardWallet]: 'nav_wallet',
  [PATHS.dashboardSaved]: 'nav_saved',
  [PATHS.dashboardPayments]: 'nav_payments',
  [PATHS.dashboardProfile]: 'nav_profile',
  [PATHS.dashboardSettings]: 'nav_settings',
  [PATHS.dashboardEscrow]: 'nav_escrow',
  [PATHS.dashboardContracts]: 'contract',
  [PATHS.notifications]: 'notifications_title',
  [PATHS.admin]: 'admin_panel',
}

function getPageTitle(pathname: string): TranslationKey {
  if (pathname.startsWith(`${PATHS.dashboardOrders}/`)) return 'nav_orders'
  if (pathname.startsWith(PATHS.dashboardServicesNew)) return 'nav_new_service'
  return PAGE_TITLES[pathname] ?? 'nav_dashboard'
}

function isNavActive(pathname: string, href: string): boolean {
  if (href === PATHS.dashboardFreelancer || href === PATHS.dashboardClient) {
    return pathname === href
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

function filterSections(sections: NavSection[], isClient: boolean): NavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (isClient && item.freelancerOnly) return false
        if (!isClient && item.clientOnly) return false
        return true
      }),
    }))
    .filter((section) => section.items.length > 0)
}

function applyBadges(
  sections: NavSection[],
  messageUnread: number,
  notificationUnread: number
): NavSection[] {
  return sections.map((section) => ({
    ...section,
    items: section.items.map((item) => {
      if (item.id === 'messages' && messageUnread > 0) return { ...item, badge: messageUnread }
      if (item.id === 'notifications' && notificationUnread > 0) return { ...item, badge: notificationUnread }
      return item
    }),
  }))
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { t, profile, signOut } = useApp()
  const role = useDashboardRole()
  const isClient = role === 'client'
  const messageUnread = useMessageUnreadCount(true)
  const notificationUnread = useNotificationUnreadCount(true)

  const sections = useMemo(() => {
    const base = filterSections(isClient ? CLIENT_SECTIONS : FREELANCER_SECTIONS, isClient)
    const withAdmin = profile?.is_admin
      ? [
          {
            titleKey: 'admin_panel' as TranslationKey,
            items: [{ id: 'admin', href: PATHS.admin, labelKey: 'admin_panel' as TranslationKey, icon: Shield }],
          },
          ...base,
        ]
      : base
    return applyBadges(withAdmin, messageUnread, notificationUnread)
  }, [isClient, profile?.is_admin, messageUnread, notificationUnread])

  const name = profile?.full_name ?? t('nav_profile')
  const roleLabel = isClient ? t('role_client_label') : t('role_freelancer_label')
  const completion = profileCompletionPercent(profile, isClient ? 'client' : 'freelancer')

  const handleLogout = async () => {
    await signOut()
    router.push(PATHS.home)
    onNavigate?.()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--kwork-border)] px-4 py-5">
        <div className="flex items-center gap-3">
          <Avatar name={name} src={profile?.avatar_url} size={48} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-bold text-[var(--kwork-text)]">{name}</p>
            <span
              className={cn(
                'mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold',
                isClient
                  ? 'bg-[var(--success-bg)] text-[var(--success)]'
                  : 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
              )}
            >
              {roleLabel}
            </span>
          </div>
        </div>
        {completion < 100 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] text-[var(--kwork-text-muted)]">
              <span>{t('profile_completion').replace('{n}', String(completion))}</span>
              <Link href={PATHS.dashboardProfile} onClick={onNavigate} className="font-medium text-[var(--color-primary)]">
                {t('profile_complete_link')}
              </Link>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--kwork-border)]">
              <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${completion}%` }} />
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2" aria-label={t('nav_dashboard')}>
        {sections.map((section) => (
          <div key={section.titleKey} className="mb-3">
            <p className="dash-nav-section-title">{t(section.titleKey)}</p>
            <div className="space-y-0.5">
              {section.items.map(({ id, href, labelKey, icon: Icon, badge }) => {
                const active = isNavActive(pathname, href)
                return (
                  <Link
                    key={id}
                    href={href}
                    onClick={onNavigate}
                    className={cn(
                      'relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition',
                      active
                        ? 'border-l-[3px] border-l-[var(--color-primary)] bg-[var(--brand-50)] pl-[9px] font-semibold text-[var(--color-primary)]'
                        : 'border-l-[3px] border-l-transparent text-[var(--kwork-text-muted)] hover:bg-[var(--neutral-50)] hover:text-[var(--kwork-text)]'
                    )}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2.25 : 2} />
                    <span className="truncate">{t(labelKey)}</span>
                    {badge != null && badge > 0 && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--error)] px-1 text-[11px] font-bold text-white">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto border-t border-[var(--kwork-border)] p-3">
        <Link
          href={PATHS.help}
          className="mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[12px] text-[var(--kwork-text-muted)] hover:bg-[var(--neutral-50)]"
        >
          <HelpCircle className="h-4 w-4" /> {t('nav_help_center')}
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[12px] text-[var(--error)] hover:bg-[var(--error-bg)]"
        >
          <LogOut className="h-4 w-4" /> {t('nav_logout')}
        </button>
      </div>
    </div>
  )
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { t, language, profile } = useApp()
  const role = useDashboardRole()
  useAdminDeniedToast()
  const [mobileOpen, setMobileOpen] = useState(false)
  const mobileDrawerRef = useRef<HTMLElement>(null)
  const pageTitle = getPageTitle(pathname)
  const isHome =
    pathname === PATHS.dashboardFreelancer || pathname === PATHS.dashboardClient
  const isClient = role === 'client'
  const completion = profileCompletionPercent(profile, isClient ? 'client' : 'freelancer')

  useEscapeClose(mobileOpen, () => setMobileOpen(false))
  useFocusTrap(mobileOpen, mobileDrawerRef)
  useBodyScrollLock(mobileOpen)

  const today = useMemo(() => new Date(), [])
  const formattedDate = useMemo(
    () => formatDashboardHeaderDate(today, language),
    [today, language]
  )

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <div className="min-h-[calc(100vh-var(--kwork-header-total))] bg-[var(--body-bg)]">
      <div className="flex">
        <aside className="dashboard-sidebar hide-mobile sticky top-[var(--kwork-header-total)] hidden h-[calc(100vh-var(--kwork-header-total))] w-[260px] shrink-0 md:flex md:flex-col">
          <SidebarContent />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="dashboard-subheader sticky top-[var(--kwork-header-total)] z-40 flex min-h-14 items-center justify-between gap-3 border-b border-[var(--kwork-border)] bg-[var(--neutral-0)] px-4 md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="show-mobile h-9 w-9 shrink-0 md:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label={t('open_menu')}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="dashboard-subheader__title-block min-w-0">
                <h1 className="dashboard-page-title truncate">{t(pageTitle)}</h1>
                <time
                  className="dashboard-subheader__date hide-mobile"
                  dateTime={today.toISOString().slice(0, 10)}
                >
                  {formattedDate}
                </time>
              </div>
            </div>
            {isHome && profile && (
              <div className="hide-mobile flex shrink-0 items-center gap-2">
                {completion < 100 && (
                  <span className="dash-header-chip dash-header-chip--progress">
                    {t('profile_completion').replace('{n}', String(completion))}
                  </span>
                )}
                <span
                  className={cn(
                    'dash-header-chip',
                    profile.is_verified ? 'dash-header-chip--verified' : 'dash-header-chip--muted'
                  )}
                >
                  {profile.is_verified ? t('badge_verified') : t('dash_verify_pending')}
                </span>
              </div>
            )}
          </header>

          <div className="dashboard-main flex-1 overflow-y-auto p-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:p-6 md:pb-6">
            <div className="mx-auto max-w-[1280px]">
              <VerifyEmailBanner />
              {children}
            </div>
          </div>
        </div>
      </div>

      <DashboardBottomNav />

      {mobileOpen && (
        <>
          <div className="drawer-backdrop show-mobile md:hidden" onClick={() => setMobileOpen(false)} aria-hidden />
          <aside
            ref={mobileDrawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('nav_dashboard')}
            className="drawer-panel show-mobile fixed inset-y-0 left-0 z-50 flex w-[min(300px,88vw)] flex-col border-r border-[var(--kwork-border)] bg-[var(--neutral-0)] shadow-[var(--shadow-lg)] md:hidden"
          >
            <div className="flex items-center justify-between border-b border-[var(--kwork-border)] px-4 py-3">
              <span className="font-bold text-[var(--color-primary)]">IshBor.uz</span>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label={t('close')}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </>
      )}
    </div>
  )
}

function DashboardBottomNav() {
  const pathname = usePathname()
  const { t } = useApp()
  const role = useDashboardRole()
  const messageUnread = useMessageUnreadCount(true)
  const notificationUnread = useNotificationUnreadCount(true)
  const isClient = role === 'client'
  const homeHref = isClient ? PATHS.dashboardClient : PATHS.dashboardFreelancer

  const items = [
    { href: homeHref, labelKey: 'nav_dashboard' as TranslationKey, icon: LayoutDashboard },
    { href: PATHS.dashboardOrders, labelKey: 'nav_orders' as TranslationKey, icon: ShoppingBag },
    {
      href: PATHS.dashboardMessages,
      labelKey: 'nav_messages' as TranslationKey,
      icon: MessageCircle,
      badge: messageUnread,
    },
    {
      href: PATHS.notifications,
      labelKey: 'nav_notifications' as TranslationKey,
      icon: Bell,
      badge: notificationUnread,
    },
    {
      href: isClient ? PATHS.dashboardProjects : PATHS.dashboardServices,
      labelKey: (isClient ? 'nav_my_projects' : 'nav_my_services') as TranslationKey,
      icon: isClient ? Briefcase : Package,
    },
  ]

  return (
    <nav
      className="dashboard-bottom-nav show-mobile fixed inset-x-0 bottom-0 z-40 border-t border-[var(--kwork-border)] bg-[var(--neutral-0)] pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label={t('nav_dashboard')}
    >
      <div className="grid grid-cols-5">
        {items.map(({ href, labelKey, icon: Icon, badge }) => {
          const active = isNavActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-medium',
                active ? 'text-[var(--color-primary)]' : 'text-[var(--kwork-text-muted)]'
              )}
            >
              <Icon className="h-[20px] w-[20px]" strokeWidth={active ? 2.25 : 2} />
              <span className="max-w-full truncate">{t(labelKey)}</span>
              {badge != null && badge > 0 && (
                <span className="absolute right-1.5 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--error)] px-1 text-[9px] font-bold text-white">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

/** @deprecated DashboardLayout ishlating */
export { DashboardLayout as DashboardShell }
