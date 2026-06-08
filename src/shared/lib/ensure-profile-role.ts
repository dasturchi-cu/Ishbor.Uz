import { api } from '@/infrastructure/api/client'
import type { ApiProfile } from '@/infrastructure/api/types'

export type ProfileRole = 'freelancer' | 'client'

/** UI roli DB bilan mos kelmasa — serverga yozish (loyiha/buyurtma oldidan) */
export async function ensureProfileRole(
  desired: ProfileRole,
  profile: ApiProfile | null | undefined,
): Promise<{ ok: true; profile: ApiProfile } | { ok: false }> {
  if (profile?.role === desired) {
    return { ok: true, profile }
  }
  try {
    const updated = await api.updateProfile({ role: desired })
    return { ok: true, profile: { ...updated, role: desired } }
  } catch {
    return { ok: false }
  }
}
