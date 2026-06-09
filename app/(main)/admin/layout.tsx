'use client'

import { AuthGuard } from '@/presentation/components/auth/auth-guard'
import { AdminGuard } from '@/presentation/features/admin/admin-guard'
import '@/presentation/styles/admin.css'

export default function AdminRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AdminGuard>{children}</AdminGuard>
    </AuthGuard>
  )
}
