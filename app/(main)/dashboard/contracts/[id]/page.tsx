import type { Metadata } from 'next'
import { ContractDetailPage } from '@/presentation/features/marketplace/contract-detail-page'

export const metadata: Metadata = {
  title: 'Shartnoma',
  robots: { index: false, follow: false },
}

export default async function DashboardContractDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ContractDetailPage contractId={id} />
}
