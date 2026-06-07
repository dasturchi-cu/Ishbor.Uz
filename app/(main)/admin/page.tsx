import { AuthGuard } from '@/presentation/components/auth/auth-guard'
import { AdminPage } from '@/presentation/features/admin/admin-page'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin — IshBor.uz',
  robots: { index: false },
}

export default function AdminRoute() {
  return (
    <AuthGuard>
      <AdminPage />
    </AuthGuard>
  )
}
