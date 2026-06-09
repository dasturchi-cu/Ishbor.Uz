import { AdminFraudPage } from '@/presentation/features/admin/admin-fraud-page'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fraud Center — Admin — IshBor.uz',
  robots: { index: false },
}

export default function AdminFraudRoute() {
  return <AdminFraudPage />
}
