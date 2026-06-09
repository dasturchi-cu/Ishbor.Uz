import { PATHS } from '@/domain/constants/routes'

const INTERIOR_PREFIXES = [
  '/dashboard',
  '/admin',
  '/onboarding',
  '/auth',
  PATHS.login,
  PATHS.register,
  PATHS.resetPassword,
] as const

/** Marketplace kategoriya/qidiruv nav yashiriladigan sahifalar */
export function hideMarketplaceNav(pathname: string): boolean {
  return INTERIOR_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export function headerLogoHref(pathname: string, dashboardHref: string, isLoggedIn: boolean): string {
  if (isLoggedIn && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
    return dashboardHref
  }
  return PATHS.home
}
