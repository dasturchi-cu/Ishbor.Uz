'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { PATHS, dashboardPathForRole } from '@/domain/constants/routes'
import { LoadingBlock } from '@/presentation/components/ui/loading-block'
import { toast } from '@/presentation/components/ui/toast'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isAuthLoading, profile, t, signOut, currentUserRole } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthLoading && !isLoggedIn) {
      router.replace(PATHS.login)
      return
    }
    if (!isAuthLoading && isLoggedIn && profile?.is_banned) {
      toast.error(t('account_banned'))
      void signOut().finally(() => router.replace(PATHS.login))
      return
    }
    if (
      !isAuthLoading &&
      isLoggedIn &&
      profile &&
      profile.onboarding_completed === false &&
      typeof window !== 'undefined' &&
      !window.location.pathname.startsWith(PATHS.onboarding)
    ) {
      router.replace(PATHS.onboarding)
    }
    if (
      !isAuthLoading &&
      isLoggedIn &&
      profile?.onboarding_completed === true &&
      typeof window !== 'undefined' &&
      window.location.pathname.startsWith(PATHS.onboarding)
    ) {
      router.replace(dashboardPathForRole(currentUserRole))
    }
  }, [isAuthLoading, isLoggedIn, profile, router, t, signOut, currentUserRole])

  if (isAuthLoading) {
    return <LoadingBlock className="min-h-[40vh] py-16" />
  }

  if (!isLoggedIn || profile?.is_banned) {
    return null
  }

  return <>{children}</>
}
