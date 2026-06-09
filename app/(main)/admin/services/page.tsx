import { AdminSectionPage } from '@/presentation/features/admin/admin-section-page'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Services — Admin — IshBor.uz',
  robots: { index: false },
}

export default function AdminServicesRoute() {
  return <AdminSectionPage section="services" />
}
