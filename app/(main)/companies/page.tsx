import type { Metadata } from 'next'
import { ComingSoonPage } from '@/presentation/features/roadmap/coming-soon-page'

export const metadata: Metadata = {
  robots: { index: false, follow: true },
}

export default function CompaniesRoute() {  return <ComingSoonPage titleKey="roadmap_companies_title" descKey="roadmap_companies_desc" />
}
