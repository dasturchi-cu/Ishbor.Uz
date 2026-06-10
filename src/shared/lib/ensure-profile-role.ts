import { api, ApiError } from '@/infrastructure/api/client'
import type { ApiProfile } from '@/infrastructure/api/types'

export type ProfileRole = 'freelancer' | 'client'

/** UI roli DB bilan mos kelmasa — serverga yozish (loyiha/buyurtma oldidan) */
export async function ensureProfileRole(
  desired: ProfileRole,
  profile: ApiProfile | null | undefined,
): Promise<{ ok: true; profile: ApiProfile } | { ok: false; message?: string }> {
  if (profile?.role === desired) {
    return { ok: true, profile }
  }
  try {
    const updated = await api.updateProfileRole(desired)
    if (updated.role === desired) {
      return { ok: true, profile: { ...updated, role: desired } }
    }
  } catch (e) {
    const message = e instanceof ApiError ? e.message : undefined
    try {
      const fresh = await api.getProfile()
      if (fresh.role === desired) {
        return { ok: true, profile: fresh }
      }
    } catch {
      /* ignore refetch */
    }
    return { ok: false, message }
  }

  try {
    const fresh = await api.getProfile()
    if (fresh.role === desired) {
      return { ok: true, profile: fresh }
    }
  } catch {
    /* ignore refetch */
  }

  return { ok: false }
}
