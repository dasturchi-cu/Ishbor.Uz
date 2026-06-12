import { Suspense } from 'react'
import { FreelancerDashboard } from '@/presentation/features/dashboard/freelancer-dashboard'
import { RouteLoadingFallback } from '@/presentation/components/ui/route-loading-fallback'

export default function FreelancerDashboardRoute() {
  return (
    <Suspense fallback={<RouteLoadingFallback className="text-[var(--ishbor-text-muted)]" />}>
      <FreelancerDashboard />
    </Suspense>
  )
}
