/** App Router URL yo'llari */
export const PATHS = {
  home: '/',
  login: '/login',
  register: '/register',
  services: '/services',
  createService: '/services/create',
  dashboardFreelancer: '/dashboard',
  dashboardClient: '/dashboard/client',
  postProject: '/post-project',
  messages: '/messages',
  wallet: '/wallet',
  settings: '/settings',
  admin: '/admin',
  terms: '/terms',
  privacy: '/privacy',
  freelancerProfile: '/freelancer',
} as const

export function servicePath(id: string) {
  return `/services/${id}`
}

export function freelancerPath(id: string) {
  return `/freelancer/${id}`
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
