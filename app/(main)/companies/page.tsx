import { FreelancersCatalog } from '@/presentation/features/freelancers/freelancers-catalog'
import { buildPageMetadata } from '@/shared/lib/seo'

export const metadata = buildPageMetadata(
  '/companies',
  'Kompaniyalar — IshBor.uz',
  "Freelancerlar va mutaxassislar — loyihangiz uchun jamoa toping."
)

export default function CompaniesRoute() {
  return (
    <FreelancersCatalog
      titleKey="companies_catalog_title"
      subtitleKey="companies_catalog_subtitle"
    />
  )
}
