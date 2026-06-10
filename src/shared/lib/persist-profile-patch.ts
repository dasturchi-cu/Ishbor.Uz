import { api } from '@/infrastructure/api/client'
import type { ApiProfile } from '@/infrastructure/api/types'

/** Profil PATCH — faqat backend API orqali. */
export async function persistProfilePatch(
  _userId: string,
  patch: Partial<ApiProfile>,
): Promise<ApiProfile> {
  return api.updateProfile(patch)
}
