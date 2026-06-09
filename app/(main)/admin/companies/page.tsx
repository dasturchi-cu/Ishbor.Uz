import { AdminCompaniesPage } from '@/presentation/features/admin/admin-companies-page'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Companies — Admin — IshBor.uz',
  robots: { index: false },
}

export default function AdminCompaniesRoute() {
  return <AdminCompaniesPage />
}
