import type { ApiProfile } from '@/infrastructure/api/types'

const KEY = 'ishbor-profile-v1'

export function readCachedProfile(): ApiProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ApiProfile
    if (parsed && typeof parsed.id === 'string') return parsed
  } catch {
    /* ignore */
  }
  return null
}

export function writeCachedProfile(profile: ApiProfile): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(KEY, JSON.stringify(profile))
  } catch {
    /* ignore */
  }
}

export function clearCachedProfile(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
