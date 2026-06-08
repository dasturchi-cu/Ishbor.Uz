import { FreelancersCatalog } from '@/presentation/features/freelancers/freelancers-catalog'
import { buildPageMetadata } from '@/shared/lib/seo'

export const metadata = buildPageMetadata(
  '/freelancers',
  'Freelancerlar — IshBor.uz',
  "O'zbekistondagi tasdiqlangan freelancerlar katalogi."
)

export default function FreelancersPage() {
  return <FreelancersCatalog />
}
