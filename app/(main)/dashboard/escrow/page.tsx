import type { Metadata } from 'next'
import { EscrowDashboardPage } from '@/presentation/features/marketplace/escrow-dashboard-page'

export const metadata: Metadata = {
  title: 'Escrow',
  robots: { index: false, follow: false },
}

export default function DashboardEscrowRoute() {
  return <EscrowDashboardPage />
}
