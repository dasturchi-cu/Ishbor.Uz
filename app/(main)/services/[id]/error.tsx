'use client'

import { RouteError } from '@/presentation/components/layout/route-error'
import { PATHS } from '@/domain/constants/routes'

export default function ServiceDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <RouteError error={error} reset={reset} homeHref={PATHS.services} homeLabelKey="nav_services" />
}
