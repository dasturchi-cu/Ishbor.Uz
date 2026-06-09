'use client'

import { usePathname } from 'next/navigation'
import { Header } from '@/presentation/components/layout/header'
import { MobileNav } from '@/presentation/components/layout/mobile-nav'
import { GuestMobileNav } from '@/presentation/components/layout/guest-mobile-nav'
import { Footer } from '@/presentation/components/layout/footer'
import { Toaster } from '@/presentation/components/ui/toast'
import { useApp } from '@/application/providers/app-provider'
import { isAdminPath, isDashboardPath, PATHS } from '@/domain/constants/routes'
import { cn } from '@/shared/lib/utils'
import { BrowserNotificationWatcher } from '@/presentation/components/layout/browser-notification-watcher'
import { SkipLink } from '@/presentation/components/layout/skip-link'
import { BadgeCountsProvider } from '@/application/providers/badge-counts-provider'
import { NotificationsProvider } from '@/application/providers/notifications-provider'
import { SupabaseRequestAuditReporter } from '@/presentation/components/dev/supabase-request-audit-reporter'
import { InboxRealtimeBridge } from '@/presentation/components/layout/inbox-realtime-bridge'

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

  return (
    <BadgeCountsProvider>
      <NotificationsProvider userId={userId} isLoggedIn={isLoggedIn}>
        <div className="flex min-h-screen flex-col bg-[var(--body-bg)]">
          <SkipLink />
          <Header />
          <main id="main-content" tabIndex={-1} className={cn('flex-1 outline-none', showMobileNav && !onDashboard && 'has-mobile-nav')}>
            {children}
          </main>
          {!hideFooter && <Footer />}
          {isLoggedIn && !onDashboard ? <MobileNav /> : !isLoggedIn ? <GuestMobileNav /> : null}
          <InboxRealtimeBridge />
          <BrowserNotificationWatcher />
          <SupabaseRequestAuditReporter />
          <Toaster />
        </div>
      </NotificationsProvider>
    </BadgeCountsProvider>
  )
}
