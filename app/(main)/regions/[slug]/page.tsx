import { notFound } from 'next/navigation'
import { UZ_REGIONS, regionFromSlug, regionSlug } from '@/domain/constants/regions'
import { RegionLandingPage } from '@/presentation/features/seo/region-landing-page'
import { buildPageMetadata } from '@/shared/lib/seo'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return UZ_REGIONS.map((region) => ({ slug: regionSlug(region) }))
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const region = regionFromSlug(slug)
  if (!region) return {}
  const title = `${region} — freelance xizmatlar | IshBor.uz`
  const description = `${region} viloyatidagi tekshirilgan freelancerlar va xizmatlar. Escrow himoyasi bilan xavfsiz buyurtma.`
  return buildPageMetadata(`/regions/${slug}`, title, description)
}

export default async function RegionRoute({ params }: Props) {
  const { slug } = await params
  const region = regionFromSlug(slug)
  if (!region) notFound()
  return <RegionLandingPage region={region} />
}
