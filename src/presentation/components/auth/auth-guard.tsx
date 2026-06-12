'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { defaultAuthDestination, isAdminPath, PATHS } from '@/domain/constants/routes'
import { LoadingBlock } from '@/presentation/components/ui/loading-block'
import { toast } from '@/presentation/components/ui/toast'
import type { ApiProfile } from '@/infrastructure/api/types'
import { TermsConsentGate } from '@/presentation/components/auth/terms-consent-gate'

function isProfileSuspended(profile: ApiProfile | null | undefined): boolean {
  if (!profile?.is_suspended) return false
  if (!profile.suspended_until) return true
  const end = new Date(profile.suspended_until)
  return !Number.isNaN(end.getTime()) && end > new Date()
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isAuthLoading, profile, t, signOut, currentUserRole } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthLoading && !isLoggedIn) {
      const returnTo =
        typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.search}`
          : ''
      const loginUrl =
        returnTo && returnTo !== PATHS.login
          ? `${PATHS.login}?returnTo=${encodeURIComponent(returnTo)}`
          : PATHS.login
      router.replace(loginUrl)
      return
    }
    if (!isAuthLoading && isLoggedIn && profile?.is_banned) {
      toast.error(t('account_banned'))
      void signOut().finally(() => router.replace(PATHS.login))
      return
    }
    if (!isAuthLoading && isLoggedIn && isProfileSuspended(profile)) {
      toast.error(t('account_suspended_title'))
      void signOut().finally(() => router.replace(PATHS.login))
      return
    }
    const path = typeof window !== 'undefined' ? window.location.pathname : ''
    if (
      !isAuthLoading &&
      isLoggedIn &&
      profile?.onboarding_completed === true &&
      path.startsWith(PATHS.onboarding)
    ) {
      router.replace(defaultAuthDestination(profile, currentUserRole))
    }
  }, [isAuthLoading, isLoggedIn, profile, router, t, signOut, currentUserRole])

  if (isAuthLoading) {
    return <LoadingBlock className="min-h-[40vh] py-16" />
  }

  if (!isLoggedIn || profile?.is_banned || isProfileSuspended(profile)) {
    return null
  }

  return <TermsConsentGate>{children}</TermsConsentGate>
}
