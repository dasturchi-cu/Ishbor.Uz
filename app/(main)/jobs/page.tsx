import { JobsLandingPage } from '@/presentation/features/roadmap/jobs-landing-page'
import { buildPageMetadata } from '@/shared/lib/seo'

export const metadata = buildPageMetadata(
  '/jobs',
  "Ish e'lonlari — IshBor.uz",
  "Ochiq loyihalar va ish e'lonlari — freelancerlar uchun."
)

export default function JobsRoute() {
  return <JobsLandingPage />
}
