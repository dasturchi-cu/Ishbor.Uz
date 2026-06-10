import { checkUsernameRemote } from '@/shared/lib/check-username-remote'

export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 30

/** Backend `normalize_username` bilan bir xil */
export function normalizeUsername(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^@/, '')
    .replace(/[^a-z0-9_]/g, '')
}

/** PATCH /profiles/me uchun — normalizatsiya + uzunlik cheklovi */
export function prepareUsernameForSubmit(raw: string): string | undefined {
  const slug = normalizeUsername(raw).slice(0, USERNAME_MAX_LENGTH)
  return slug.length >= USERNAME_MIN_LENGTH ? slug : undefined
}

export function isUsernameLengthValid(raw: string): boolean {
  const len = normalizeUsername(raw).length
  return len >= USERNAME_MIN_LENGTH && len <= USERNAME_MAX_LENGTH
}

export function slugFromEmailOrName(email: string, fullName: string): string {
  const fromEmail = email.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]/g, '') ?? ''
  if (fromEmail.length >= 3) return fromEmail.slice(0, USERNAME_MAX_LENGTH)
  const fromName = fullName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
  if (fromName.length >= 3) return fromName.slice(0, USERNAME_MAX_LENGTH)
  return 'ishbor'
}

export async function pickAvailableUsername(email: string, fullName: string): Promise<string> {
  const base = slugFromEmailOrName(email, fullName)
  for (let i = 0; i < 8; i++) {
    const suffix = i === 0 ? '' : String(i)
    const candidate = `${base.slice(0, Math.max(USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH - suffix.length))}${suffix}`
    const slug = candidate.length >= 3 ? candidate : `u${suffix}${Date.now().toString(36).slice(-3)}`
    const res = await checkUsernameRemote(slug)
    if (res.available) return slug
  }
  return `${base.slice(0, 12)}${Date.now().toString(36).slice(-6)}`
}
