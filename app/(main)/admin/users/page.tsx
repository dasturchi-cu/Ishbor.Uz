import { AdminUsersPage } from '@/presentation/features/admin/admin-users-page'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Users — Admin — IshBor.uz',
  robots: { index: false },
}

export default function AdminUsersRoute() {
  return <AdminUsersPage />
}
