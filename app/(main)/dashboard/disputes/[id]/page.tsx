import type { Metadata } from 'next'
import { DisputePage } from '@/presentation/features/marketplace/dispute-page'

export const metadata: Metadata = {
  title: 'Nizo',
  robots: { index: false, follow: false },
}

export default async function DashboardDisputeRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <DisputePage disputeId={id} />
}
