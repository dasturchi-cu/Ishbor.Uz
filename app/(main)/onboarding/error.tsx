'use client'

import { RouteError } from '@/presentation/components/layout/route-error'
import { PATHS } from '@/domain/constants/routes'

export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <RouteError error={error} reset={reset} homeHref={PATHS.home} homeLabelKey="nav_dashboard" />
}
