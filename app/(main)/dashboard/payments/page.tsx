import type { Metadata } from 'next'
import { DashboardPaymentsPage } from '@/presentation/features/dashboard/dashboard-payments-page'
import { buildPageMetadata } from '@/shared/lib/seo'

export const metadata: Metadata = buildPageMetadata(
  '/dashboard/payments',
  "To'lovlar — IshBor.uz",
  "To'lov usullari va tranzaksiyalar tarixi."
)

export default function DashboardPaymentsRoute() {
  return <DashboardPaymentsPage />
}
