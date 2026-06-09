import { AdminFeatureFlagsPage } from '@/presentation/features/admin/admin-feature-flags-page'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Feature flags — Admin — IshBor.uz',
  robots: { index: false },
}

export default function AdminFeatureFlagsRoute() {
  return <AdminFeatureFlagsPage />
}
