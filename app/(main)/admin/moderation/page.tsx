import { AdminModerationPage } from '@/presentation/features/admin/admin-moderation-page'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Moderation — Admin — IshBor.uz',
  robots: { index: false },
}

export default function AdminModerationRoute() {
  return <AdminModerationPage />
}
