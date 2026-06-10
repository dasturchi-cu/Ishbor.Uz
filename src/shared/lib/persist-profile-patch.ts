import { api, ApiError } from '@/infrastructure/api/client'
import { getSupabase, isSupabaseConfigured } from '@/infrastructure/supabase/client'
import type { ApiProfile } from '@/infrastructure/api/types'

function isBackendUnavailable(err: unknown): boolean {
  return (
    err instanceof ApiError &&
    (err.status === 0 || err.status === 408 || err.status === 503 || err.status >= 500)
  )
}

/** Profil PATCH — backend yo'q bo'lsa Supabase RLS orqali fallback. */
export async function persistProfilePatch(
  userId: string,
  patch: Partial<ApiProfile>,
): Promise<void> {
  try {
    await api.updateProfile(patch)
    return
  } catch (e) {
    if (!isBackendUnavailable(e)) throw e
  }

  if (!isSupabaseConfigured()) {
    throw new ApiError('Backend ishlamayapti. Terminalda: pnpm dev:start', 0, '/api/v1/profiles/me')
  }

  const supabase = getSupabase()
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId)
  if (error) {
    throw new Error(error.message)
  }
}
