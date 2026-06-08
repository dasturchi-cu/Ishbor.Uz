import { PATHS } from '@/domain/constants/routes'

/** Supabase parol tiklash havolasi (hash yoki query) */
export function isPasswordRecoveryUrl(
  search = '',
  hash = '',
  pathname = '',
): boolean {
  if (pathname === PATHS.resetPassword) return false

  const params = new URLSearchParams(search)
  const type = params.get('type')

  return (
    hash.includes('type=recovery') ||
    type === 'recovery' ||
    (Boolean(params.get('token_hash')) && type === 'recovery') ||
    (Boolean(params.get('code')) && type === 'recovery')
  )
}

export function passwordRecoveryRedirectUrl(search = '', hash = ''): string {
  return `${PATHS.resetPassword}${search}${hash}`
}

export function readBrowserRecoveryUrl(): { search: string; hash: string; pathname: string } | null {
  if (typeof window === 'undefined') return null
  return {
    search: window.location.search,
    hash: window.location.hash,
    pathname: window.location.pathname,
  }
}
