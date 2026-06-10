import { uploadAvatar } from '@/infrastructure/supabase/storage'
import { isSupabaseConfigured } from '@/infrastructure/supabase/client'
import { persistProfilePatch } from '@/shared/lib/persist-profile-patch'

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

  await persistProfilePatch(userId, payload)
}
