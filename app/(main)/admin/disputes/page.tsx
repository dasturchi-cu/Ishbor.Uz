import { AdminDisputesPage } from '@/presentation/features/admin/admin-disputes-page'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Disputes — Admin — IshBor.uz',
  robots: { index: false },
}

export default function AdminDisputesRoute() {
  return <AdminDisputesPage />
}
