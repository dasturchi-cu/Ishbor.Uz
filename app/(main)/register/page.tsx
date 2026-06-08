import { Suspense } from 'react'
import { RegisterPage } from '@/presentation/features/auth/register-page'
import { LoadingBlock } from '@/presentation/components/ui/loading-block'
import { buildPageMetadata } from '@/shared/lib/seo'

export const metadata = buildPageMetadata(
  '/register',
  "Ro'yxatdan o'tish — IshBor.uz",
  "IshBor.uz da freelancer yoki mijoz sifatida ro'yxatdan o'ting."
)

export default function RegisterRoute() {
  return (
    <Suspense fallback={<LoadingBlock className="min-h-[60vh]" />}>
      <RegisterPage />
    </Suspense>
  )
}
