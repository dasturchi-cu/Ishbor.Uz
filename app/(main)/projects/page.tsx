import { ProjectsCatalog } from '@/presentation/features/projects/projects-catalog'
import { buildPageMetadata } from '@/shared/lib/seo'

export const metadata = buildPageMetadata(
  '/projects',
  "Loyihalar — IshBor.uz",
  "Ochiq loyihalar katalogi — freelancerlar uchun ish imkoniyatlari."
)

export default function ProjectsPage() {
  return <ProjectsCatalog />
}
