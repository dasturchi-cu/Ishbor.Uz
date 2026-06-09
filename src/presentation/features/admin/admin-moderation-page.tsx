'use client'

import { AdminLayout } from '@/presentation/features/admin/admin-layout'
import { AdminSaasPanel } from '@/presentation/features/admin/admin-saas-panel'

export function AdminModerationPage() {
  return (
    <AdminLayout>
      <AdminSaasPanel />
    </AdminLayout>
  )
}
