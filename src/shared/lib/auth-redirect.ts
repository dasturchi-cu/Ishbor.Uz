import { defaultAuthDestination, PATHS } from '@/domain/constants/routes'

export function loginPath(returnTo?: string): string {
  if (!returnTo || returnTo === PATHS.login || returnTo === PATHS.register) {
    return PATHS.login
  }
  return `${PATHS.login}?returnTo=${encodeURIComponent(returnTo)}`
}

export function registerPath(returnTo?: string): string {
  if (!returnTo) return PATHS.register
  return `${PATHS.register}?returnTo=${encodeURIComponent(returnTo)}`
}

export function resolveReturnTo(searchParams: URLSearchParams, fallback: string): string {
  const raw = searchParams.get('returnTo')
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return fallback
  return raw
}

export function resolvePostAuthDestination(
  searchParams: URLSearchParams,
  profile: { is_admin?: boolean; role?: string; onboarding_completed?: boolean } | null | undefined,
  role: 'freelancer' | 'client' = 'freelancer',
): string {
  const returnTo = searchParams.get('returnTo')
  if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') && returnTo !== PATHS.login) {
    return returnTo
  }
  if (!profile?.onboarding_completed && !profile?.is_admin) {
    return PATHS.onboarding
  }
  return defaultAuthDestination(profile, role)
}
