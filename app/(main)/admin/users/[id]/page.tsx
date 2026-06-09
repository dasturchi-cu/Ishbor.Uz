import { AdminUserDetailPage } from '@/presentation/features/admin/admin-user-detail-page'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'User — Admin — IshBor.uz',
  robots: { index: false },
}

export default async function AdminUserDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <AdminUserDetailPage userId={id} />
}
