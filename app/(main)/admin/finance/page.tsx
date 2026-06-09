import { AdminSectionPage } from '@/presentation/features/admin/admin-section-page'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Finance — Admin — IshBor.uz',
  robots: { index: false },
}

export default function AdminFinanceRoute() {
  return <AdminSectionPage section="finance" />
}
