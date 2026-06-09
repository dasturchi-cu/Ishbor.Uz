import { Suspense } from 'react'
import { FreelancerDashboard } from '@/presentation/features/dashboard/freelancer-dashboard'

export default function FreelancerDashboardRoute() {
  return (
    <Suspense fallback={<div className="text-[var(--ishbor-text-muted)]">...</div>}>
      <FreelancerDashboard />
    </Suspense>
  )
}
