import { AuthGuard } from '@/presentation/components/auth/auth-guard'
import { OnboardingPage } from '@/presentation/features/onboarding/onboarding-page'
import { buildPageMetadata } from '@/shared/lib/seo'

export const metadata = buildPageMetadata(
  '/onboarding',
  'Profil sozlash — IshBor.uz',
  'IshBor profilini to\'ldiring va platformadan to\'liq foydalaning.'
)

export default function OnboardingRoute() {
  return (
    <AuthGuard>
      <OnboardingPage />
    </AuthGuard>
  )
}
