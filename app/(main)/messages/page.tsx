import { Suspense } from 'react'
import { AuthGuard } from '@/presentation/components/auth/auth-guard'
import { MessagesPage } from '@/presentation/features/chat/messages-page'

export default function MessagesRoute() {
  return (
    <AuthGuard>
      <Suspense fallback={<div className="p-8 text-muted-foreground">...</div>}>
        <MessagesPage />
      </Suspense>
    </AuthGuard>
  )
}