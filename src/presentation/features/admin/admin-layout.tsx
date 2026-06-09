'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Scale,
  Landmark,
  Building2,
  Megaphone,
  Wallet,
  Shield,
  Package,
  ShoppingBag,
  Menu,
  X,
  ArrowLeft,
  RefreshCw,
  Flag,
  Database,
  ShieldAlert,
  BarChart3,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { Avatar } from '@/presentation/components/ui/avatar'
import { Button } from '@/presentation/components/ui/button'
import { dashboardPathForRole, PATHS } from '@/domain/constants/routes'
import { cn } from '@/shared/lib/utils'
import { useEscapeClose } from '@/shared/lib/use-escape-close'
import { useFocusTrap } from '@/shared/lib/use-focus-trap'
import { useBodyScrollLock } from '@/shared/lib/use-body-scroll-lock'
import type { TranslationKey } from '@/infrastructure/i18n'
import {
  AdminCommandPalette,
  useAdminCommandPalette,
} from '@/presentation/features/admin/admin-command-palette'

interface AdminNavItem {
  href: string
  labelKey: TranslationKey
  icon: LucideIcon
  match?: (pathname: string) => boolean
}

const ADMIN_NAV: AdminNavItem[] = [
  { href: PATHS.admin, labelKey: 'admin_nav_dashboard', icon: LayoutDashboard, match: (p) => p === PATHS.admin },
  { href: PATHS.adminUsers, labelKey: 'admin_nav_users', icon: Users },
  { href: PATHS.adminFraud, labelKey: 'admin_nav_fraud', icon: ShieldAlert },
  { href: PATHS.adminDisputes, labelKey: 'admin_nav_disputes', icon: Scale },
  { href: PATHS.adminEscrow, labelKey: 'admin_nav_escrow', icon: Landmark },
  { href: PATHS.adminFinance, labelKey: 'admin_nav_finance', icon: Wallet },
  { href: PATHS.adminModeration, labelKey: 'admin_nav_moderation', icon: Shield },
  { href: PATHS.adminAnalytics, labelKey: 'admin_nav_analytics', icon: BarChart3 },
  { href: PATHS.adminFeatureFlags, labelKey: 'admin_nav_feature_flags', icon: Flag },
  { href: PATHS.adminBackups, labelKey: 'admin_nav_backups', icon: Database },
  { href: PATHS.adminBroadcast, labelKey: 'admin_nav_broadcast', icon: Megaphone },
  { href: PATHS.adminCompanies, labelKey: 'admin_nav_companies', icon: Building2 },
  { href: PATHS.adminServices, labelKey: 'admin_nav_services', icon: Package },
  { href: PATHS.adminOrders, labelKey: 'admin_nav_orders', icon: ShoppingBag },
]

function isNavActive(item: AdminNavItem, pathname: string) {
  if (item.match) return item.match(pathname)
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

function pageTitleKey(pathname: string): TranslationKey {
  if (pathname.startsWith(PATHS.adminUsers)) return 'admin_page_users'
  if (pathname.startsWith(PATHS.adminFraud)) return 'admin_nav_fraud'
  if (pathname.startsWith(PATHS.adminAnalytics)) return 'admin_nav_analytics'
  if (pathname.startsWith(PATHS.adminDisputes)) return 'admin_page_disputes'
  if (pathname.startsWith(PATHS.adminEscrow)) return 'admin_page_escrow'
  if (pathname.startsWith(PATHS.adminFinance)) return 'admin_page_finance'
  if (pathname.startsWith(PATHS.adminModeration)) return 'admin_page_moderation'
  if (pathname.startsWith(PATHS.adminFeatureFlags)) return 'admin_nav_feature_flags'
  if (pathname.startsWith(PATHS.adminBackups)) return 'admin_nav_backups'
  if (pathname.startsWith(PATHS.adminServices)) return 'admin_page_services'
  if (pathname.startsWith(PATHS.adminOrders)) return 'admin_page_orders'
  if (pathname.startsWith(PATHS.adminBroadcast)) return 'admin_nav_broadcast'
  if (pathname.startsWith(PATHS.adminCompanies)) return 'admin_nav_companies'
  return 'admin_nav_dashboard'
}

export function AdminLayout({
  children,
  onRefresh,
  refreshing,
}: {
  children: React.ReactNode
  onRefresh?: () => void
  refreshing?: boolean
}) {
  const pathname = usePathname()
  const { t, profile, currentUserRole } = useApp()
  const [mobileOpen, setMobileOpen] = useState(false)
  const mobileRef = useRef<HTMLDivElement>(null)
  const commandPalette = useAdminCommandPalette()

  useEscapeClose(mobileOpen, () => setMobileOpen(false))
  useFocusTrap(mobileOpen, mobileRef)
  useBodyScrollLock(mobileOpen)

  const titleKey = useMemo(() => pageTitleKey(pathname), [pathname])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 border-b border-white/10 px-4">
        <span className="text-sm font-semibold tracking-tight text-white">IshBor Admin</span>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label={t('admin_panel')}>
        {ADMIN_NAV.map((item) => {
          const active = isNavActive(item, pathname)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'admin-nav-item flex min-h-10 items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors',
                active
                  ? 'bg-[var(--admin-sidebar-active)] text-white'
                  : 'text-[var(--admin-sidebar-text)] hover:bg-white/8 hover:text-white',
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {t(item.labelKey)}
            </Link>
          )
        })}
      </nav>
      <div className="space-y-0.5 border-t border-white/10 p-3">
        <Link
          href={dashboardPathForRole(currentUserRole)}
          className="admin-nav-item flex min-h-10 items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-[var(--admin-sidebar-text)] transition-colors hover:bg-white/8 hover:text-white"
        >
          <LayoutDashboard className="size-4 shrink-0" aria-hidden />
          {t('nav_dashboard')}
        </Link>
        <Link
          href={PATHS.home}
          className="admin-nav-item flex min-h-10 items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-[var(--admin-sidebar-text)] transition-colors hover:bg-white/8 hover:text-white"
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden />
          {t('admin_back_to_site')}
        </Link>
      </div>
    </div>
  )

  return (
    <div className="admin-shell flex min-h-screen bg-[var(--admin-bg)]">
      <aside className="hidden w-[240px] shrink-0 bg-[var(--admin-sidebar)] md:block">{sidebar}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label={t('close')}
            onClick={() => setMobileOpen(false)}
          />
          <div ref={mobileRef} className="absolute inset-y-0 left-0 w-[min(280px,88vw)] bg-[var(--admin-sidebar)] shadow-xl">
            <div className="flex justify-end p-2">
              <Button variant="ghost" size="sm" onClick={() => setMobileOpen(false)} aria-label={t('close')}>
                <X className="size-5 text-white" />
              </Button>
            </div>
            {sidebar}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label={t('open_menu')}
            >
              <Menu className="size-5" />
            </Button>
            <h1 className="truncate text-[15px] font-semibold text-[var(--admin-text)]">{t(titleKey)}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden md:inline-flex"
              onClick={() => commandPalette.setOpen(true)}
            >
              {t('admin_search_cmd')}
            </Button>
            {onRefresh && (
              <Button variant="outline" size="sm" loading={refreshing} onClick={onRefresh} className="hidden sm:inline-flex">
                <RefreshCw className="mr-1.5 size-3.5" />
                {t('admin_refresh')}
              </Button>
            )}
            <div className="flex items-center gap-2 rounded-lg border border-[var(--admin-border)] px-2 py-1">
              <Avatar name={profile?.full_name ?? 'Admin'} src={profile?.avatar_url} size={32} />
              <span className="hidden max-w-[120px] truncate text-[13px] text-[var(--admin-text)] sm:inline">
                {profile?.full_name ?? profile?.email}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 lg:p-6">{children}</main>
      </div>

      <AdminCommandPalette
        open={commandPalette.open}
        onClose={() => commandPalette.setOpen(false)}
        onRefresh={onRefresh}
      />
    </div>
  )
}
