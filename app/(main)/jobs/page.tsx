import type { Metadata } from 'next'
import { ComingSoonPage } from '@/presentation/features/roadmap/coming-soon-page'

export const metadata: Metadata = {
  robots: { index: false, follow: true },
}

export default function JobsRoute() {
  return <ComingSoonPage titleKey="roadmap_jobs_title" descKey="roadmap_jobs_desc" />
}