import { ProjectsLandingPage } from '@/presentation/features/projects/projects-landing-page'
import { buildPageMetadata } from '@/shared/lib/seo'

export const metadata = buildPageMetadata(
  '/projects',
  "Loyihalar — IshBor.uz",
  "Ochiq loyihalar katalogi — freelancerlar uchun ish imkoniyatlari."
)

export default function ProjectsPage() {
  return <ProjectsLandingPage />
}
