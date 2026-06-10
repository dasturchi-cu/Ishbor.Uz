import { api } from '@/infrastructure/api/client'
import { normalizeUsername } from '@/shared/lib/username'

/** Username tekshiruv — backend API orqali. */
export async function checkUsernameRemote(
  username: string,
  options?: { excludeUserId?: string | null; signal?: AbortSignal },
): Promise<{ available: boolean }> {
  const slug = normalizeUsername(username)
  if (slug.length < 3) return { available: false }
  return api.checkUsername(slug, options?.signal)
}
