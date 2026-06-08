import type { Metadata } from 'next'
import { ComingSoonPage } from '@/presentation/features/roadmap/coming-soon-page'

export const metadata: Metadata = {
  robots: { index: false, follow: true },
}

export default function CvBuilderRoute() {  return <ComingSoonPage titleKey="roadmap_cv_title" descKey="roadmap_cv_desc" />
}
