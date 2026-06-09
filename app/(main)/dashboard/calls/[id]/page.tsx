import type { Metadata } from 'next'
import { CallRoomPage } from '@/presentation/features/marketplace/call-room-page'

export const metadata: Metadata = {
  title: "Qo'ng'iroq",
  robots: { index: false, follow: false },
}

export default async function DashboardCallRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CallRoomPage callId={id} />
}
