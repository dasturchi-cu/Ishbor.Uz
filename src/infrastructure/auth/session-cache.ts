import { getSupabase, isSupabaseConfigured } from '@/infrastructure/supabase/client'

export interface CachedSession {
  accessToken: string
  userId: string
  expiresAt: number
}

let cached: CachedSession | null = null
let inflight: Promise<CachedSession | null> | null = null

/** Parallel API chaqiruvlarida bitta getSession — AuthRetryableFetchError oldini oladi */
export async function getCachedSession(): Promise<CachedSession | null> {
  if (!isSupabaseConfigured()) return null

  const now = Math.floor(Date.now() / 1000)
  if (cached && cached.expiresAt - now > 30) {
    return cached
  }

  if (inflight) return inflight

  inflight = (async () => {
    try {
      const supabase = getSupabase()
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) return cached

      const session = sessionData.session
      if (session?.access_token && session.user?.id) {
        cached = {
          accessToken: session.access_token,
          userId: session.user.id,
          expiresAt: session.expires_at ?? 0,
        }
        return cached
      }

      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) {
        cached = null
        return null
      }

      cached = null
      return null
    } catch {
      return cached
    } finally {
      inflight = null
    }
  })()

  return inflight
}

export async function getCachedAccessToken(): Promise<string | null> {
  const session = await getCachedSession()
  return session?.accessToken ?? null
}

/** 401 yoki eskirgan token — yangi sessiya olish */
export async function refreshCachedSession(): Promise<CachedSession | null> {
  if (!isSupabaseConfigured()) return null

  cached = null
  inflight = null

  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.auth.refreshSession()
    const session = data.session
    if (!error && session?.access_token && session.user) {
      cached = {
        accessToken: session.access_token,
        userId: session.user.id,
        expiresAt: session.expires_at ?? 0,
      }
      return cached
    }
  } catch {
    /* fallback getSession */
  }

  return getCachedSession()
}

export function clearAuthCache(): void {
  cached = null
  inflight = null
}

/** TOKEN_REFRESHED — keshni tozalamasdan yangi token bilan yangilash */
export function updateCachedSessionToken(accessToken: string, expiresAt: number, userId: string): void {
  cached = { accessToken, userId, expiresAt }
}
