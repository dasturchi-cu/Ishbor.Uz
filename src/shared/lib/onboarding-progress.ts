import type { ApiProfile, ApiProject, ApiService } from '@/infrastructure/api/types'
import { profileCompletionPercent } from '@/shared/lib/profile-completion'

export interface OnboardingProgress {
  done: number
  total: number
  percent: number
  complete: boolean
}

export function freelancerOnboardingProgress(
  profile: ApiProfile | null | undefined,
  services: ApiService[],
  hasOrders: boolean,
  birjaSeen: boolean
): OnboardingProgress {
  const completion = profileCompletionPercent(profile, 'freelancer')
  const checks = [
    completion >= 100,
    services.length >= 1,
    services.some((s) => s.price > 0) && Boolean(profile?.bio?.trim()),
    birjaSeen || hasOrders,
  ]
  const done = checks.filter(Boolean).length
  const total = checks.length
  return {
    done,
    total,
    percent: Math.round((done / total) * 100),
    complete: done === total,
  }
}

export function clientOnboardingProgress(
  profile: ApiProfile | null | undefined,
  projects: ApiProject[],
  hasOrders: boolean
): OnboardingProgress {
  const completion = profileCompletionPercent(profile, 'client')
  const checks = [completion >= 100, projects.length >= 1, hasOrders]
  const done = checks.filter(Boolean).length
  const total = checks.length
  return {
    done,
    total,
    percent: Math.round((done / total) * 100),
    complete: done === total,
  }
}
