'use client'

import { useApp } from '@/application/providers/app-provider'
import { LoadingBlock } from '@/presentation/components/ui/loading-block'
import { TermsConsentGate } from '@/presentation/components/auth/terms-consent-gate'
import { PostProject } from '@/presentation/features/project/post-project'
import { PostProjectGuestPage } from '@/presentation/features/project/post-project-guest-page'
import { PostProjectClientGate } from '@/presentation/features/project/post-project-client-gate'

export function PostProjectEntry() {
  const { isLoggedIn, isAuthLoading, currentUserRole } = useApp()

  if (isAuthLoading) {
    return <LoadingBlock className="min-h-[40vh] py-16" />
  }

  if (!isLoggedIn) {
    return <PostProjectGuestPage />
  }

  if (currentUserRole !== 'client') {
    return <PostProjectClientGate />
  }

  return (
    <TermsConsentGate>
      <PostProject />
    </TermsConsentGate>
  )
}
