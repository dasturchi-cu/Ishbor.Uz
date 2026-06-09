import { PATHS } from '@/domain/constants/routes'
import type { TranslationKey } from '@/infrastructure/i18n'
import type { BreadcrumbItem } from '@/presentation/components/layout/breadcrumb'

const PAGE_TITLE_KEYS: Record<string, TranslationKey> = {
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
}

function pageTitleKey(pathname: string): TranslationKey {
  if (pathname.startsWith(`${PATHS.dashboardOrders}/`)) return 'nav_orders'
  if (pathname.startsWith(PATHS.dashboardServicesNew)) return 'nav_new_service'
  const editMatch = pathname.match(/^\/dashboard\/services\/[^/]+\/edit$/)
  if (editMatch) return 'edit_service'
  return PAGE_TITLE_KEYS[pathname] ?? 'nav_dashboard'
}

export function buildDashboardBreadcrumbs(
  pathname: string,
  role: 'freelancer' | 'client',
  t: (key: TranslationKey) => string
): BreadcrumbItem[] {
  const homeHref = role === 'client' ? PATHS.dashboardClient : PATHS.dashboardFreelancer
  const isHome = pathname === homeHref
  if (isHome) return []

  const crumbs: BreadcrumbItem[] = [{ label: t('nav_dashboard'), href: homeHref }]

  if (pathname.startsWith(`${PATHS.dashboardOrders}/`)) {
    crumbs.push({ label: t('nav_orders'), href: PATHS.dashboardOrders })
    crumbs.push({ label: t('order_detail_breadcrumb') })
    return crumbs
  }

  const editMatch = pathname.match(/^\/dashboard\/services\/([^/]+)\/edit$/)
  if (editMatch) {
    crumbs.push({ label: t('nav_my_services'), href: PATHS.dashboardServices })
    crumbs.push({ label: t('edit_service') })
    return crumbs
  }

  if (pathname.startsWith(PATHS.dashboardServicesNew)) {
    crumbs.push({ label: t('nav_my_services'), href: PATHS.dashboardServices })
    crumbs.push({ label: t('nav_new_service') })
    return crumbs
  }

  crumbs.push({ label: t(pageTitleKey(pathname)) })
  return crumbs
}
