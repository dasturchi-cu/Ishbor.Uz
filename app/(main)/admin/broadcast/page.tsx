import { AdminBroadcastPage } from '@/presentation/features/admin/admin-broadcast-page'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Broadcast — Admin — IshBor.uz',
  robots: { index: false },
}

export default function AdminBroadcastRoute() {
  return <AdminBroadcastPage />
}
