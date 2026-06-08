import { api } from '@/infrastructure/api/client'
import { uploadAvatar } from '@/infrastructure/supabase/storage'
import { isSupabaseConfigured } from '@/infrastructure/supabase/client'

export interface ProfileFieldValues {
  full_name: string
  username?: string
  bio: string
  region: string
  specialty: string
  avatar_url?: string
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
  await api.updateProfile({
    full_name: values.full_name.trim() || undefined,
    username: values.username?.trim() || undefined,
    bio: values.bio.trim() || undefined,
    region: values.region || undefined,
    specialty: values.specialty.trim() || undefined,
    ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
  })
}
