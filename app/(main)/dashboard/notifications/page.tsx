import { NotificationsPage } from '@/presentation/features/notifications/notifications-page'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bildirishnomalar — IshBor.uz',
  description: 'Buyurtmalar, xabarlar va yangiliklar',
}

export default function DashboardNotificationsRoute() {
  return <NotificationsPage />
}
