import { AdminAnalyticsPage } from '@/presentation/features/admin/admin-analytics-page'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Analytics — Admin — IshBor.uz',
  robots: { index: false },
}

export default function AdminAnalyticsRoute() {
  return <AdminAnalyticsPage />
}
