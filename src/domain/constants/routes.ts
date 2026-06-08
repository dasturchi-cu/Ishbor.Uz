/** App Router URL yo'llari */
export const PATHS = {
  home: '/',
  login: '/login',
  resetPassword: '/auth/reset-password',
  register: '/register',
  onboarding: '/onboarding',
  authRole: '/auth/role',
  services: '/services',
  createService: '/services/create',
  dashboardFreelancer: '/dashboard',
  dashboardClient: '/dashboard/client',
  dashboardServices: '/dashboard/services',
  dashboardServicesNew: '/dashboard/services/new',
  dashboardServiceEdit: (id: string) => `/dashboard/services/${id}/edit`,
  dashboardOrders: '/dashboard/orders',
  dashboardMessages: '/dashboard/messages',
  dashboardReviews: '/dashboard/reviews',
  dashboardAnalytics: '/dashboard/analytics',
  dashboardWallet: '/dashboard/wallet',
  dashboardSaved: '/dashboard/saved',
  dashboardPayments: '/dashboard/payments',
  dashboardProfile: '/dashboard/profile',
  dashboardSettings: '/dashboard/settings',
  postProject: '/post-project',
  projects: '/projects',
  dashboardProjects: '/dashboard/projects',
  dashboardApplications: '/dashboard/applications',
  messages: '/dashboard/messages',
  wallet: '/dashboard/wallet',
  settings: '/dashboard/settings',
  admin: '/admin',
  terms: '/terms',
  privacy: '/privacy',
  freelancerProfile: '/freelancer',
  freelancers: '/freelancers',
  blog: '/blog',
  help: '/help',
  pricing: '/pricing',
  notifications: '/dashboard/notifications',
  jobs: '/jobs',
  companies: '/companies',
  cvBuilder: '/cv-builder',
} as const

export function servicePath(id: string) {
  return `/services/${id}`
}

export function freelancerPath(id: string) {
  return `/freelancer/${id}`
}

export function dashboardOrderPath(id: string) {
  return `/dashboard/orders/${id}`
}

export function projectPath(id: string) {
  return `/projects/${id}`
}

export type AppPath = (typeof PATHS)[keyof typeof PATHS]

/** Eski SPA kalitlari — backward compat */
export const APP_ROUTES = {
  landing: 'landing',
  register: 'register',
  login: 'login',
  freelancerDashboard: 'freelancer-dashboard',
  clientDashboard: 'client-dashboard',
  servicesCatalog: 'services-catalog',
  freelancerProfile: 'freelancer-profile',
  postProject: 'post-project',
  messages: 'messages',
  wallet: 'wallet',
  profileSettings: 'profile-settings',
} as const

export type AppRoute = (typeof APP_ROUTES)[keyof typeof APP_ROUTES]

const ROUTE_TO_PATH: Record<AppRoute, string> = {
  [APP_ROUTES.landing]: PATHS.home,
  [APP_ROUTES.register]: PATHS.register,
  [APP_ROUTES.login]: PATHS.login,
  [APP_ROUTES.freelancerDashboard]: PATHS.dashboardFreelancer,
  [APP_ROUTES.clientDashboard]: PATHS.dashboardClient,
  [APP_ROUTES.servicesCatalog]: PATHS.services,
  [APP_ROUTES.freelancerProfile]: PATHS.freelancerProfile,
  [APP_ROUTES.postProject]: PATHS.postProject,
  [APP_ROUTES.messages]: PATHS.messages,
  [APP_ROUTES.wallet]: PATHS.wallet,
  [APP_ROUTES.profileSettings]: PATHS.settings,
}

export function pathForRoute(route: AppRoute): string {
  return ROUTE_TO_PATH[route]
}

export function dashboardPathForRole(role: 'freelancer' | 'client'): string {
  return role === 'freelancer' ? PATHS.dashboardFreelancer : PATHS.dashboardClient
}

/** Kirishdan keyin default yo'nalish — admin ustuvor */
export function defaultAuthDestination(
  profile: { is_admin?: boolean; role?: string } | null | undefined,
  role: 'freelancer' | 'client' = 'freelancer',
): string {
  if (profile?.is_admin) return PATHS.admin
  return dashboardPathForRole(role)
}

/** Dashboard ichki sahifalar (freelancer + client) */
export function isDashboardPath(pathname: string): boolean {
  return (
    pathname === PATHS.dashboardFreelancer ||
    pathname.startsWith(`${PATHS.dashboardFreelancer}/`) ||
    pathname === PATHS.dashboardClient ||
    pathname.startsWith(`${PATHS.dashboardClient}/`)
  )
}

export function isFreelancerOnlyDashboardPath(pathname: string): boolean {
  const freelancerOnly = [
    PATHS.dashboardServices,
    PATHS.dashboardServicesNew,
    PATHS.dashboardReviews,
    PATHS.dashboardAnalytics,
  ]
  return freelancerOnly.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export function isClientOnlyDashboardPath(pathname: string): boolean {
  const clientOnly = [PATHS.dashboardSaved, PATHS.dashboardPayments]
  return clientOnly.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}
