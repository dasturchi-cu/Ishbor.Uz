'use client'

import React, { useState, Suspense, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search, Menu, X } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { CategoryNav } from '@/presentation/components/layout/category-nav'
import { LanguagePill } from '@/presentation/components/layout/language-pill'
import { AvatarDropdown } from '@/presentation/components/dashboard/avatar-dropdown'
import { HeaderWalletPill } from '@/presentation/components/layout/header-wallet-pill'
import { SearchAutocomplete } from '@/presentation/components/layout/search-autocomplete'
import { NotificationDropdown } from '@/presentation/components/dashboard/notification-dropdown'
import { dashboardPathForRole, PATHS } from '@/domain/constants/routes'
import { headerLogoHref, hideMarketplaceNav } from '@/shared/lib/marketplace-nav'
import { cn } from '@/shared/lib/utils'
import { useEscapeClose } from '@/shared/lib/use-escape-close'
import { useFocusTrap } from '@/shared/lib/use-focus-trap'
import { useBodyScrollLock } from '@/shared/lib/use-body-scroll-lock'
import { HeaderLogo } from '@/presentation/components/layout/header-logo'

function HeaderSearchSync({ onQuery }: { onQuery: (q: string) => void }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname === PATHS.services) {
      onQuery(searchParams.get('q') ?? '')
    }
  }, [pathname, searchParams, onQuery])

  return null
}

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const {
    t,
    language,
    setLanguage,
    isLoggedIn,
    isAuthLoading,
    currentUserRole,
    profile,
  } = useApp()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const mobileDrawerRef = useRef<HTMLDivElement>(null)

  useEscapeClose(mobileOpen, () => setMobileOpen(false))
  useFocusTrap(mobileOpen, mobileDrawerRef)
  useBodyScrollLock(mobileOpen)

  const dashboardHref = dashboardPathForRole(currentUserRole)
  const showAuthNav = !isAuthLoading && isLoggedIn
  const logoHref = headerLogoHref(pathname, dashboardHref, showAuthNav)
  const showCategoryNav = !hideMarketplaceNav(pathname) && pathname !== PATHS.home
  const isHome = pathname === PATHS.home

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    const q = searchQuery.trim()
    router.push(q ? `${PATHS.services}?q=${encodeURIComponent(q)}` : PATHS.services)
  }

  const hideOnAuth =
    pathname === PATHS.login || pathname === PATHS.register || pathname === PATHS.resetPassword
  if (hideOnAuth) return null

  return (
    <header className="ishbor-site-header sticky top-0 z-50">
      <Suspense fallback={null}>
        <HeaderSearchSync onQuery={setSearchQuery} />
      </Suspense>
      <div className="layout-container ishbor-site-header__bar max-w-[1280px]">
        <div className="ishbor-site-header__top">
          <HeaderLogo
            href={logoHref}
            tagline={t('header_logo_tagline')}
            layout={showAuthNav ? 'inline' : 'stacked'}
          />

          <div className={cn('ishbor-site-header__search-slot hide-mobile', isHome && 'hidden')}>
            <SearchAutocomplete
              value={searchQuery}
              onChange={setSearchQuery}
              onSubmit={handleSearch}
              placeholder={t('header_search_placeholder')}
              className="w-full"
              variant="header"
            />
          </div>

          <div className="header-auth-cluster ishbor-site-header__actions">
            {!showAuthNav && (
              <LanguagePill language={language} setLanguage={setLanguage} className="hide-mobile" />
            )}

            {!isAuthLoading && !isLoggedIn && (
              <>
                <Link
                  href={PATHS.login}
                  className="hide-mobile px-3 py-2 text-[14px] font-medium text-[var(--ishbor-text)] transition hover:text-[var(--color-primary)]"
                >
                  {t('login')}
                </Link>
                <Link href={PATHS.register}>
                  <Button variant="primary" size="md" className="px-4 font-semibold sm:px-5">
                    {t('register')}
                  </Button>
                </Link>
              </>
            )}

            {showAuthNav && (
              <div className="header-auth-cluster">
                <Link
                  href={dashboardHref}
                  className="hide-mobile rounded-full border border-[var(--ishbor-border)] bg-[var(--neutral-0)] px-4 py-2 text-[13px] font-semibold text-[var(--ishbor-text)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                >
                  {t('nav_dashboard')}
                </Link>
                <NotificationDropdown />
                <HeaderWalletPill compact className="show-mobile" />
                <HeaderWalletPill />
                <LanguagePill language={language} setLanguage={setLanguage} className="hide-mobile" />
                <AvatarDropdown size={28} />
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="show-mobile h-11 w-11 shrink-0"
              onClick={() => router.push(PATHS.services)}
              aria-label={t('header_search_placeholder')}
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="show-mobile h-11 w-11 shrink-0"
              onClick={() => setMobileOpen(true)}
              aria-label={t('open_menu')}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

      </div>

      {showCategoryNav && (
        <Suspense fallback={null}>
          <CategoryNav />
        </Suspense>
      )}

      {mobileOpen && (
        <>
          <div className="drawer-backdrop show-mobile" onClick={() => setMobileOpen(false)} aria-hidden />
          <div
            ref={mobileDrawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('nav_main_menu')}
            className="drawer-panel show-mobile fixed inset-y-0 right-0 z-50 border-l border-[var(--ishbor-border)] bg-[var(--color-bg)] p-5 shadow-[var(--shadow-lg)]"
          >
            <div className="mb-4 flex items-center justify-between">
              <HeaderLogo href={PATHS.home} compact className="pointer-events-none" />
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label={t('close')}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <SearchAutocomplete
              value={searchQuery}
              onChange={setSearchQuery}
              onSubmit={(e) => {
                handleSearch(e)
                setMobileOpen(false)
              }}
              placeholder={t('header_search_placeholder')}
              className="mb-4"
              variant="header"
            />

            <LanguagePill language={language} setLanguage={setLanguage} className="mb-4" />

            {showAuthNav ? (
              <nav className="mb-4 flex flex-col gap-1">
                <MobileLink href={dashboardHref} onNavigate={() => setMobileOpen(false)}>{t('nav_dashboard')}</MobileLink>
                <MobileLink href={PATHS.dashboardOrders} onNavigate={() => setMobileOpen(false)}>{t('nav_orders')}</MobileLink>
                <MobileLink href={PATHS.dashboardMessages} onNavigate={() => setMobileOpen(false)}>{t('nav_messages')}</MobileLink>
                <div className="flex items-center justify-between gap-2 px-3 py-2">
                  <MobileLink href={PATHS.dashboardWallet} onNavigate={() => setMobileOpen(false)}>{t('nav_wallet')}</MobileLink>
                  <HeaderWalletPill compact className="!inline-flex shrink-0" />
                </div>
                <MobileLink href={PATHS.services} onNavigate={() => setMobileOpen(false)}>{t('nav_services')}</MobileLink>
                {currentUserRole !== 'client' && (
                  <MobileLink href={PATHS.dashboardServices} onNavigate={() => setMobileOpen(false)}>
                    {t('nav_my_services')}
                  </MobileLink>
                )}
                <MobileLink href={PATHS.postProject} onNavigate={() => setMobileOpen(false)}>{t('nav_project_marketplace')}</MobileLink>
                <MobileLink href={PATHS.notifications} onNavigate={() => setMobileOpen(false)}>{t('nav_notifications')}</MobileLink>
                {profile?.is_admin && (
                  <MobileLink href={PATHS.admin} onNavigate={() => setMobileOpen(false)}>
                    {t('admin_panel')}
                  </MobileLink>
                )}
              </nav>
            ) : (
              <nav className="flex flex-col gap-1" aria-label={t('nav_main_menu')}>
                <MobileLink href={PATHS.services} onNavigate={() => setMobileOpen(false)}>{t('nav_services')}</MobileLink>
                <MobileLink href={PATHS.freelancers} onNavigate={() => setMobileOpen(false)}>{t('nav_freelancers')}</MobileLink>
                <MobileLink href={PATHS.projects} onNavigate={() => setMobileOpen(false)}>{t('nav_project_marketplace')}</MobileLink>
                <MobileLink href={PATHS.help} onNavigate={() => setMobileOpen(false)}>{t('nav_help_center')}</MobileLink>
              </nav>
            )}

            <div className="mt-6 border-t border-[var(--ishbor-border)] pt-4">
              {!isAuthLoading && !isLoggedIn ? (
                <div className="flex flex-col gap-2">
                  <Link href={PATHS.login} onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" fullWidth>{t('login')}</Button>
                  </Link>
                  <Link href={PATHS.register} onClick={() => setMobileOpen(false)}>
                    <Button variant="primary" fullWidth>{t('register')}</Button>
                  </Link>
                </div>
              ) : showAuthNav ? (
                <Link href={PATHS.dashboardProfile} onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" fullWidth>{t('nav_profile')}</Button>
                </Link>
              ) : null}
            </div>
          </div>
        </>
      )}
    </header>
  )
}

function MobileLink({
  href,
  onNavigate,
  children,
}: {
  href: string
  onNavigate: () => void
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--ishbor-text)] hover:bg-[var(--ishbor-bg)]"
    >
      {children}
    </Link>
  )
}

/** @deprecated use Header */
export { Header as Navbar }
