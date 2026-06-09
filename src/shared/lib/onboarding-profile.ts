import type { ApiProfile } from '@/infrastructure/api/types'

export type OnboardingExpLevel = 'junior' | 'mid' | 'expert'

export function parseSpecialtyTitle(specialty: string | null | undefined): string {
  if (!specialty?.trim()) return ''
  return specialty.split(' · ')[0]?.trim() ?? ''
}

export function parseSpecialtySkillExtras(specialty: string | null | undefined): string[] {
  if (!specialty?.trim()) return []
  return specialty
    .split(' · ')
    .slice(1)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function normalizeExpLevel(value: string | null | undefined): OnboardingExpLevel {
  if (value === 'junior' || value === 'mid' || value === 'expert') return value
  return 'mid'
}

export function normalizeLanguages(
  rows: ApiProfile['languages'] | undefined
): { lang: string; level: string }[] {
  if (!rows?.length) return [{ lang: 'uz', level: 'fluent' }]
  return rows
    .filter((r): r is { lang: string; level: string } => Boolean(r?.lang && r?.level))
    .map((r) => ({ lang: r.lang, level: r.level }))
}

const EXP_LEVEL_LABEL_KEYS = {
  junior: 'exp_junior',
  mid: 'exp_mid',
  expert: 'exp_expert',
} as const

export function experienceLevelLabelKey(
  level: string | null | undefined
): (typeof EXP_LEVEL_LABEL_KEYS)[OnboardingExpLevel] | null {
  if (level === 'junior' || level === 'mid' || level === 'expert') {
    return EXP_LEVEL_LABEL_KEYS[level]
  }
  return null
}
