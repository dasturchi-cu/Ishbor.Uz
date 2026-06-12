import type { CachedProfile } from '@/infrastructure/supabase/middleware-profile-cache'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8002'
const FLAGS_TIMEOUT_MS = 5_000

type SessionFlagsResponse = {
  is_banned: boolean
  is_admin: boolean
  onboarding_completed: boolean
  role?: string | null
  is_suspended: boolean
}

export async function fetchSessionFlags(accessToken: string): Promise<CachedProfile | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/profiles/session-flags`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(FLAGS_TIMEOUT_MS),
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = (await res.json()) as SessionFlagsResponse
    const role =
      data.role === 'client' ? 'client' : data.role === 'freelancer' ? 'freelancer' : undefined
    return {
      is_banned: Boolean(data.is_banned),
      is_admin: Boolean(data.is_admin),
      onboarding_completed: Boolean(data.onboarding_completed),
      is_suspended: Boolean(data.is_suspended),
      role,
    }
  } catch {
    return null
  }
}
