import { FreelancerProfile } from '@/presentation/features/profile/freelancer-profile'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return {
    title: `Freelancer profili — IshBor.uz`,
    description: `Freelancer profili ${id}`,
  }
}

export default async function FreelancerProfileRoute({ params }: Props) {
  const { id } = await params
  return <FreelancerProfile profileId={id} />
}
