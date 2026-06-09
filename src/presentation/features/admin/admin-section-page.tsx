'use client'

import { AdminLayout } from '@/presentation/features/admin/admin-layout'
import { AdminPage, type AdminPageSection } from '@/presentation/features/admin/admin-page'

export function AdminSectionPage({ section }: { section: AdminPageSection }) {
  return (
    <AdminLayout>
      <AdminPage section={section} />
    </AdminLayout>
  )
}
