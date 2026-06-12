import type { Metadata } from 'next'
import { noIndexMetadata } from '@/shared/lib/seo'
import { DashboardRouteShell } from './dashboard-route-shell'

export const metadata: Metadata = noIndexMetadata({
  title: 'Dashboard — IshBor.uz',
})

export default function DashboardRouteLayout({ children }: { children: React.ReactNode }) {
  return <DashboardRouteShell>{children}</DashboardRouteShell>
}
