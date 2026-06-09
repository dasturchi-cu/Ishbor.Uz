import { AdminEscrowPage } from '@/presentation/features/admin/admin-escrow-page'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Escrow — Admin — IshBor.uz',
  robots: { index: false },
}

export default function AdminEscrowRoute() {
  return <AdminEscrowPage />
}
