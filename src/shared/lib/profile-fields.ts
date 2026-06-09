import { api, ApiError } from '@/infrastructure/api/client'
import { uploadAvatar } from '@/infrastructure/supabase/storage'
import { isSupabaseConfigured } from '@/infrastructure/supabase/client'

export interface ProfileFieldValues {
  full_name: string
  username?: string
  bio: string
  region: string
  specialty: string
  avatar_url?: string
  skills?: string[]
}

export async function saveProfileFields(
  userId: string,
  values: ProfileFieldValues,
  pendingAvatarFile?: File | null,
  currentAvatarUrl?: string | null,
): Promise<void> {
  let avatarUrl = values.avatar_url ?? currentAvatarUrl ?? undefined
  if (pendingAvatarFile && isSupabaseConfigured()) {
    avatarUrl = await uploadAvatar(pendingAvatarFile, userId)
  }
  const payload = {
    full_name: values.full_name.trim() || undefined,
    username: values.username?.trim() || undefined,
    bio: values.bio.trim() || undefined,
    region: values.region || undefined,
    specialty: values.specialty.trim() || undefined,
    skills: values.skills,
    ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await api.updateProfile(payload)
      return
    } catch (e) {
      if (e instanceof ApiError && e.status === 503 && attempt < 2) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)))
        continue
      }
      throw e
    }
  }
}
