'use client'

import '@/presentation/styles/shell-chrome.css'
import '@/presentation/styles/marketplace-visual-v2.css'
import '@/presentation/styles/marketplace-world-class.css'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { Header } from '@/presentation/components/layout/header'
import { MobileNav } from '@/presentation/components/layout/mobile-nav'
import { GuestMobileNav } from '@/presentation/components/layout/guest-mobile-nav'
import { Toaster } from '@/presentation/components/ui/toast'
import { useApp } from '@/application/providers/app-provider'
import { QueryProvider } from '@/application/providers/query-provider'
import { isAdminPath, isDashboardPath, PATHS } from '@/domain/constants/routes'
import { cn } from '@/shared/lib/utils'
import { SkipLink } from '@/presentation/components/layout/skip-link'
import { BadgeCountsProvider } from '@/application/providers/badge-counts-provider'
import { NotificationsProvider } from '@/application/providers/notifications-provider'
import { DashboardPrefetcher } from '@/presentation/components/dashboard/dashboard-prefetcher'

const Footer = dynamic(
  () => import('@/presentation/components/layout/footer').then((m) => m.Footer),
  { ssr: false }
)
const BrowserNotificationWatcher = dynamic(
  () =>
    import('@/presentation/components/layout/browser-notification-watcher').then(
      (m) => m.BrowserNotificationWatcher
    ),
  { ssr: false }
)
const InboxRealtimeBridge = dynamic(
  () => import('@/presentation/components/layout/inbox-realtime-bridge').then((m) => m.InboxRealtimeBridge),
  { ssr: false }
)
const SupabaseRequestAuditReporter = dynamic(
  () =>
    import('@/presentation/components/dev/supabase-request-audit-reporter').then(
      (m) => m.SupabaseRequestAuditReporter
    ),
  { ssr: false }
)

export function SiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isLoggedIn, isAuthLoading, userId } = useApp()
  const isAuthPage =
    pathname === PATHS.login || pathname === PATHS.register || pathname === PATHS.resetPassword
  const onDashboard = isDashboardPath(pathname)
  const hideFooter = onDashboard
  const showMobileNav = !isAuthPage && !isAuthLoading

  if (isAuthPage || isAdminPath(pathname)) {
    return (
      <>
        {children}
        <Toaster />
      </>
    )
  }

  const shell = (
    <>
      {isLoggedIn ? <DashboardPrefetcher /> : null}
      <div className="flex min-h-screen flex-col bg-[var(--body-bg)]">
        <SkipLink />
        <Header />
        <main id="main-content" tabIndex={-1} className={cn('flex-1 outline-none', showMobileNav && !onDashboard && 'has-mobile-nav')}>
          {children}
        </main>
        {!hideFooter && <Footer />}
        {isLoggedIn && !onDashboard ? <MobileNav /> : !isLoggedIn ? <GuestMobileNav /> : null}
        {isLoggedIn ? <InboxRealtimeBridge /> : null}
        {isLoggedIn ? <BrowserNotificationWatcher /> : null}
        <SupabaseRequestAuditReporter />
        <Toaster />
      </div>
    </>
  )

  return (
    <QueryProvider>
      {isLoggedIn ? (
        <BadgeCountsProvider>
          <NotificationsProvider userId={userId} isLoggedIn={isLoggedIn}>
            {shell}
          </NotificationsProvider>
        </BadgeCountsProvider>
      ) : (
        shell
      )}
    </QueryProvider>
  )
}
