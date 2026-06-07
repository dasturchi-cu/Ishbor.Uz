import { Suspense } from 'react'
import { AuthGuard } from '@/presentation/components/auth/auth-guard'
import { FreelancerDashboard } from '@/presentation/features/dashboard/freelancer-dashboard'

export default function FreelancerDashboardRoute() {
  return (
    <AuthGuard>
      <Suspense fallback={<div className="p-8 text-muted-foreground">...</div>}>
        <FreelancerDashboard />
      </Suspense>
    </AuthGuard>
  )
}
