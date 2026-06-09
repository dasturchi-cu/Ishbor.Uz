'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { PATHS } from '@/domain/constants/routes'
import { LoadingBlock } from '@/presentation/components/ui/loading-block'

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { profile, isAuthLoading } = useApp()
  const router = useRouter()
  const pathname = usePathname()

  const needsOnboarding = Boolean(profile && !profile.is_admin && !profile.onboarding_completed)

  useEffect(() => {
    if (!isAuthLoading && needsOnboarding && pathname !== PATHS.onboarding) {
      router.replace(PATHS.onboarding)
    }
  }, [isAuthLoading, needsOnboarding, pathname, router])

  if (isAuthLoading) {
    return <LoadingBlock className="min-h-[40vh] py-12" />
  }

  if (needsOnboarding && pathname !== PATHS.onboarding) {
    return null
  }

  return <>{children}</>
}
