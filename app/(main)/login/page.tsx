import { Suspense } from 'react'
import { LoginPage } from '@/presentation/features/auth/login-page'
import { LoadingBlock } from '@/presentation/components/ui/loading-block'
import { buildPageMetadata } from '@/shared/lib/seo'

export const metadata = buildPageMetadata(
  '/login',
  'Kirish — IshBor.uz',
  'IshBor.uz hisobingizga kiring va buyurtmalaringizni boshqaring.'
)

export default function LoginRoute() {
  return (
    <Suspense fallback={<LoadingBlock className="min-h-[60vh]" />}>
      <LoginPage />
    </Suspense>
  )
}
