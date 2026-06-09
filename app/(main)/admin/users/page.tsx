import { AdminSectionPage } from '@/presentation/features/admin/admin-section-page'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Users — Admin — IshBor.uz',
  robots: { index: false },
}

export default function AdminUsersRoute() {
  return <AdminSectionPage section="users" />
}
