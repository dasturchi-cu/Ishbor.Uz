import { AdminDashboard } from '@/presentation/features/admin/admin-dashboard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin — IshBor.uz',
  robots: { index: false },
}

export default function AdminRoute() {
  return <AdminDashboard />
}
