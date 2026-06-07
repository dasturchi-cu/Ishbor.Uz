import { ServiceDetailPage } from '@/presentation/features/catalog/service-detail'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return {
    title: `Xizmat — IshBor.uz`,
    description: `Xizmat tafsilotlari ${id}`,
  }
}

export default async function ServiceDetailRoute({ params }: Props) {
  const { id } = await params
  return <ServiceDetailPage serviceId={id} />
}
