import { getSupabase, isSupabaseConfigured } from '@/infrastructure/supabase/client'

export interface CachedSession {
  accessToken: string
  userId: string
  expiresAt: number
}

const SESSION_FETCH_TIMEOUT_MS = 8_000

let cached: CachedSession | null = null
let inflight: Promise<CachedSession | null> | null = null

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('session fetch timeout')), ms)
    }),
  ])
}

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
      const { data: sessionData, error: sessionError } = await withTimeout(
        supabase.auth.getSession(),
        SESSION_FETCH_TIMEOUT_MS,
      )
      if (sessionError) {
        cached = null
        return null
      }

      const session = sessionData.session
      if (!session) {
        cached = null
        return null
      }

      if (session.access_token && session.user?.id) {
        cached = {
          accessToken: session.access_token,
          userId: session.user.id,
          expiresAt: session.expires_at ?? 0,
        }
        return cached
      }

      // Sessiya bor, token yo'q — faqat shu holatda refresh
      const { data: refreshData, error: refreshError } = await withTimeout(
        supabase.auth.refreshSession(),
        SESSION_FETCH_TIMEOUT_MS,
      )
      const refreshed = refreshData.session
      if (!refreshError && refreshed?.access_token && refreshed.user?.id) {
        cached = {
          accessToken: refreshed.access_token,
          userId: refreshed.user.id,
          expiresAt: refreshed.expires_at ?? 0,
        }
        return cached
      }

      cached = null
      return null
    } catch {
      cached = null
      return null
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
    const { data, error } = await withTimeout(
      supabase.auth.refreshSession(),
      SESSION_FETCH_TIMEOUT_MS,
    )
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
