import { getSupabase } from '@/infrastructure/supabase/client'
import { PATHS } from '@/domain/constants/routes'

export async function signInWithGoogle(returnTo?: string): Promise<void> {
  const supabase = getSupabase()
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const params = new URLSearchParams()
  if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    params.set('returnTo', returnTo)
  }
  const qs = params.toString()
  const redirectTo = `${origin}/auth/callback${qs ? `?${qs}` : ''}`

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  })
  if (error) throw error
}

export function oauthCallbackDestination(returnTo: string | null, isNewUser: boolean): string {
  if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    return returnTo
  }
  return isNewUser ? PATHS.onboarding : PATHS.dashboardFreelancer
}
