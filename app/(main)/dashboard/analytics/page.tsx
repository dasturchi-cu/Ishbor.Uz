import type { Metadata } from 'next'
import { DashboardAnalyticsPage } from '@/presentation/features/dashboard/dashboard-analytics-page'
import { buildPageMetadata } from '@/shared/lib/seo'

export const metadata: Metadata = buildPageMetadata(
  '/dashboard/analytics',
  'Statistika — IshBor.uz',
  'Daromad, buyurtmalar va ko\'rishlar statistikasi.'
)

export default function DashboardAnalyticsRoute() {
  return <DashboardAnalyticsPage />
}
