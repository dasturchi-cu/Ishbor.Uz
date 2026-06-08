import { ProjectsCatalog } from '@/presentation/features/projects/projects-catalog'
import { buildPageMetadata } from '@/shared/lib/seo'

export const metadata = buildPageMetadata(
  '/jobs',
  "Ish e'lonlari — IshBor.uz",
  "Ochiq loyihalar va ish e'lonlari — freelancerlar uchun."
)

export default function JobsRoute() {
  return <ProjectsCatalog titleKey="jobs_catalog_title" subtitleKey="jobs_catalog_subtitle" />
}
