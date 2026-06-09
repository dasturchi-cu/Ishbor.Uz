import { BuyerProtectionPage } from '@/presentation/features/trust/buyer-protection-page'
import { buildPageMetadata } from '@/shared/lib/seo'

export const metadata = buildPageMetadata(
  '/buyer-protection',
  'Xaridor himoyasi — IshBor.uz',
  'Escrow himoyasi, nizo hal qilish va shaffof komissiya.'
)

export default function BuyerProtectionRoute() {
  return <BuyerProtectionPage />
}
