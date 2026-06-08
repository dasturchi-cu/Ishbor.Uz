import { Suspense } from 'react'
import type { Metadata } from 'next'
import { AuthGuard } from '@/presentation/components/auth/auth-guard'
import { MessagesPage } from '@/presentation/features/chat/messages-page'
import { buildPageMetadata } from '@/shared/lib/seo'

export const metadata: Metadata = buildPageMetadata(
  '/messages',
  'Xabarlar — IshBor.uz',
  'Buyurtma bo\'yicha freelancer va mijoz bilan xavfsiz chat.'
)

export default function MessagesRoute() {
  return (
    <AuthGuard>
      <Suspense fallback={<div className="p-8 text-muted-foreground">...</div>}>
        <MessagesPage />
      </Suspense>
    </AuthGuard>
  )
}
