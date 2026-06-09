import type { Metadata } from 'next'
import { ContractsListPage } from '@/presentation/features/marketplace/contracts-list-page'

export const metadata: Metadata = {
  title: 'Shartnomalar',
  robots: { index: false, follow: false },
}

export default function DashboardContractsRoute() {
  return <ContractsListPage />
}
