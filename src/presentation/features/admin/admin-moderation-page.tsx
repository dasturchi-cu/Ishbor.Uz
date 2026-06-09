'use client'

import { AdminLayout } from '@/presentation/features/admin/admin-layout'
import { AdminModerationTabs } from '@/presentation/features/admin/admin-moderation-tabs'

export function AdminModerationPage() {
  return (
    <AdminLayout>
      <AdminModerationTabs />
    </AdminLayout>
  )
}
