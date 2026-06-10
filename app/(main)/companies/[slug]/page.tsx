import type { Metadata } from 'next'
import { CompanyDetailPage } from '@/presentation/features/companies/company-detail-page'
import { fetchCompanyForMeta } from '@/infrastructure/api/server-fetch'
import { pageAlternates, pageUrl, ogImageUrls, ogImages } from '@/shared/lib/seo'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const company = await fetchCompanyForMeta(slug)
  const title = company?.name ? `${company.name} — IshBor.uz` : 'Kompaniya — IshBor.uz'
  const description =
    company?.description?.slice(0, 160) ??
    "O'zbekistondagi kompaniya profili — tasdiqlangan ish beruvchilar va jamoalar."
  return {
    title,
    description,
    alternates: pageAlternates(`/companies/${slug}`),
    openGraph: {
      title,
      description,
      url: pageUrl(`/companies/${slug}`),
      type: 'website',
      images: ogImages(),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImageUrls(),
    },
  }
}

export default async function CompanyDetailRoute({ params }: Props) {
  const { slug } = await params
  return <CompanyDetailPage slug={slug} />
}
