import { AdminSectionPage } from '@/presentation/features/admin/admin-section-page'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Orders — Admin — IshBor.uz',
  robots: { index: false },
}

export default function AdminOrdersRoute() {
  return <AdminSectionPage section="orders" />
}
