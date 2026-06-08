import { Suspense } from 'react'
import { FreelancerDashboard } from '@/presentation/features/dashboard/freelancer-dashboard'

export default function FreelancerDashboardRoute() {
  return (
    <Suspense fallback={<div className="text-[var(--kwork-text-muted)]">...</div>}>
      <FreelancerDashboard />
    </Suspense>
  )
}
