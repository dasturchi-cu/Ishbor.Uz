import type { Metadata } from 'next'
import { MessagesPage } from '@/presentation/features/chat/messages-page'
import { buildPageMetadata } from '@/shared/lib/seo'

export const metadata: Metadata = buildPageMetadata(
  '/dashboard/messages',
  'Xabarlar — IshBor.uz',
  'Dashboard chat: buyurtmalar bo\'yicha yozishmalar.'
)

export default function DashboardMessagesRoute() {
  return <MessagesPage />
}
