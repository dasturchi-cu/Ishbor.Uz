import { RegionsIndexPage } from '@/presentation/features/seo/regions-index-page'
import { buildPageMetadata } from '@/shared/lib/seo'

export const metadata = buildPageMetadata(
  '/regions',
  "O'zbekiston viloyatlari — freelance xizmatlar | IshBor.uz",
  "Barcha viloyatlardagi tekshirilgan freelancerlar va xizmatlar. Escrow himoyasi bilan xavfsiz buyurtma.",
)

export default function RegionsRoute() {
  return <RegionsIndexPage />
}
