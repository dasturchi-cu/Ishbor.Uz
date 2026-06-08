import { CompaniesLandingPage } from '@/presentation/features/roadmap/companies-landing-page'
import { buildPageMetadata } from '@/shared/lib/seo'

export const metadata = buildPageMetadata(
  '/companies',
  'Kompaniyalar — IshBor.uz',
  "Freelancerlar va mutaxassislar — loyihangiz uchun jamoa toping."
)

export default function CompaniesRoute() {
  return <CompaniesLandingPage />
}
