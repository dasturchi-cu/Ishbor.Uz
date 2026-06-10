import { api } from '@/infrastructure/api/client'

const KEY = 'ishbor-waitlist'

export function saveWaitlistEmailLocal(email: string): void {
  if (typeof window === 'undefined') return
  const normalized = email.trim().toLowerCase()
  if (!normalized) return
  const existing = getWaitlistEmails()
  if (!existing.includes(normalized)) {
    localStorage.setItem(KEY, JSON.stringify([...existing, normalized]))
  }
}

export function getWaitlistEmails(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((e): e is string => typeof e === 'string') : []
  } catch {
    return []
  }
}

/** API saqlash; muvaffaqiyat faqat server 204 qaytarganda. */
export async function saveWaitlistEmail(email: string, source = 'general'): Promise<boolean> {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return false
  try {
    await api.joinWaitlist(normalized, source)
    saveWaitlistEmailLocal(normalized)
    return true
  } catch {
    return false
  }
}
