import type { Metadata } from 'next'
import { AdminBackupsPage } from '@/presentation/features/admin/admin-backups-page'

export const metadata: Metadata = {
  title: 'Zaxira nusxalar',
  robots: { index: false, follow: false },
}

export default function AdminBackupsRoute() {
  return <AdminBackupsPage />
}
