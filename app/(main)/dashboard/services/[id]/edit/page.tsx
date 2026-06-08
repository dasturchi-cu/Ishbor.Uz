import { DashboardEditServicePage } from '@/presentation/features/dashboard/dashboard-edit-service-page'

type Props = { params: Promise<{ id: string }> }

export default async function EditServiceRoute({ params }: Props) {
  const { id } = await params
  return <DashboardEditServicePage serviceId={id} />
}
