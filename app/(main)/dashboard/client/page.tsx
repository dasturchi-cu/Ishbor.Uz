import { AuthGuard } from '@/presentation/components/auth/auth-guard'
import { ClientDashboard } from '@/presentation/features/dashboard/client-dashboard'

export default function ClientDashboardRoute() {
  return (
    <AuthGuard>
      <ClientDashboard />
    </AuthGuard>
  )
}
