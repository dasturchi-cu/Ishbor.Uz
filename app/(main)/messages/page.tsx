import { Suspense } from 'react'
import type { Metadata } from 'next'
import { AuthGuard } from '@/presentation/components/auth/auth-guard'
import { MessagesPage } from '@/presentation/features/chat/messages-page'
import { RouteLoadingFallback } from '@/presentation/components/ui/route-loading-fallback'
import { buildPageMetadata, noIndexMetadata } from '@/shared/lib/seo'

export const metadata: Metadata = {
  ...buildPageMetadata(
    '/messages',
    'Xabarlar — IshBor.uz',
    'Buyurtma bo\'yicha freelancer va mijoz bilan xavfsiz chat.',
  ),
  ...noIndexMetadata(),
}

export default function MessagesRoute() {
  return (
    <AuthGuard>
      <Suspense fallback={<RouteLoadingFallback className="p-8" />}>
        <MessagesPage />
      </Suspense>
    </AuthGuard>
  )
}
