import { FreelancerProfile } from '@/presentation/features/profile/freelancer-profile'
import { fetchProfileForMeta } from '@/infrastructure/api/server-fetch'
import { ogImageUrls, ogImages, pageAlternates, pageUrl } from '@/shared/lib/seo'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const profile = await fetchProfileForMeta(id)
  const title = profile?.full_name
    ? `${profile.full_name} — IshBor.uz`
    : 'Freelancer profili — IshBor.uz'
  const description =
    profile?.bio?.slice(0, 160) ??
    profile?.specialty ??
    "O'zbekistondagi freelancer profili"
  return {
    title,
    description,
    alternates: pageAlternates(`/freelancer/${id}`),
    openGraph: {
      title,
      description,
      url: pageUrl(`/freelancer/${id}`),
      type: 'profile',
      images: ogImages(profile?.avatar_url),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImageUrls(profile?.avatar_url),
    },
  }
}

export default async function FreelancerProfileRoute({ params }: Props) {
  const { id } = await params
  return <FreelancerProfile profileId={id} />
}
