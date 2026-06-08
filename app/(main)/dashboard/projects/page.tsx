import { Suspense } from 'react'
import { DashboardProjectsPage } from '@/presentation/features/dashboard/dashboard-projects-page'

export default function DashboardProjectsRoute() {
  return (
    <Suspense fallback={null}>
      <DashboardProjectsPage />
    </Suspense>
  )
}
