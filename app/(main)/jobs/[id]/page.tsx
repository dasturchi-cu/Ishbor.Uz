import type { Metadata } from 'next'
import { VacancyDetailPage } from '@/presentation/features/vacancies/vacancy-detail-page'
import { fetchVacancyForMeta } from '@/infrastructure/api/server-fetch'
import { pageAlternates, pageUrl, ogImageUrls, ogImages } from '@/shared/lib/seo'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const vacancy = await fetchVacancyForMeta(id)
  const title = vacancy?.title ? `${vacancy.title} — IshBor.uz` : "Vakansiya — IshBor.uz"
  const description =
    vacancy?.description?.slice(0, 160) ??
    "O'zbekistondagi ish e'loni — tasdiqlangan ish beruvchilar bilan xavfsiz ariza."
  return {
    title,
    description,
    alternates: pageAlternates(`/jobs/${id}`),
    openGraph: {
      title,
      description,
      url: pageUrl(`/jobs/${id}`),
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

export default async function VacancyDetailRoute({ params }: Props) {
  const { id } = await params
  return <VacancyDetailPage vacancyId={id} />
}
