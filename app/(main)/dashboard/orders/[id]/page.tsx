import type { Metadata } from 'next'
import { DashboardOrderDetailPage } from '@/presentation/features/dashboard/dashboard-order-detail-page'

export const metadata: Metadata = {
  title: 'Buyurtma',
  robots: { index: false, follow: false },
}

export default async function DashboardOrderDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <DashboardOrderDetailPage orderId={id} />
}
