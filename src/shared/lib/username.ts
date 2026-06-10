import { api } from '@/infrastructure/api/client'

/** Backend `normalize_username` bilan bir xil */
export function normalizeUsername(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^@/, '')
    .replace(/[^a-z0-9_]/g, '')
}

export function slugFromEmailOrName(email: string, fullName: string): string {
  const fromEmail = email.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]/g, '') ?? ''
  if (fromEmail.length >= 3) return fromEmail.slice(0, 24)
  const fromName = fullName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
  if (fromName.length >= 3) return fromName.slice(0, 24)
  return 'ishbor'
}

export async function pickAvailableUsername(email: string, fullName: string): Promise<string> {
  const base = slugFromEmailOrName(email, fullName)
  for (let i = 0; i < 8; i++) {
    const suffix = i === 0 ? '' : String(i)
    const candidate = `${base.slice(0, Math.max(3, 24 - suffix.length))}${suffix}`
    const slug = candidate.length >= 3 ? candidate : `u${suffix}${Date.now().toString(36).slice(-3)}`
    const res = await api.checkUsername(slug)
    if (res.available) return slug
  }
  return `${base.slice(0, 12)}${Date.now().toString(36).slice(-6)}`
}
