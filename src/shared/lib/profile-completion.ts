import type { ApiProfile } from '@/infrastructure/api/types'

export function profileCompletionPercent(
  profile: ApiProfile | null | undefined,
  role: 'client' | 'freelancer'
): number {
  if (!profile) return 0

  const checks: boolean[] = [
    Boolean(profile.full_name?.trim()),
    Boolean(profile.username?.trim()),
    Boolean(profile.region?.trim()),
    Boolean(profile.avatar_url?.trim()),
  ]

  if (role === 'freelancer') {
    checks.push(
      Boolean(profile.specialty?.trim()),
      Boolean(profile.bio?.trim()),
      (profile.portfolio_urls?.length ?? 0) > 0,
    )
  }

  const done = checks.filter(Boolean).length
  return Math.round((done / checks.length) * 100)
}
