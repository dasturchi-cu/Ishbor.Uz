import { ServiceDetailPage } from '@/presentation/features/catalog/service-detail'
import { fetchServiceForMeta } from '@/infrastructure/api/server-fetch'
import { ogImageUrls, ogImages, pageAlternates, pageUrl } from '@/shared/lib/seo'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const service = await fetchServiceForMeta(id)
  const title = service?.title ? `${service.title} — IshBor.uz` : 'Xizmat — IshBor.uz'
  const description =
    service?.description?.slice(0, 160) ?? "O'zbekistondagi freelance xizmati"
  const imageUrl = service?.image_urls?.[0] ?? null
  return {
    title,
    description,
    alternates: pageAlternates(`/services/${id}`),
    openGraph: {
      title,
      description,
      url: pageUrl(`/services/${id}`),
      type: 'website',
      images: ogImages(imageUrl),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImageUrls(imageUrl),
    },
  }
}

export default async function ServiceDetailRoute({ params }: Props) {
  const { id } = await params
  return <ServiceDetailPage serviceId={id} />
}
