import { CvBuilderPage } from '@/presentation/features/cv-builder/cv-builder-page'
import { buildPageMetadata } from '@/shared/lib/seo'

export const metadata = buildPageMetadata(
  '/cv-builder',
  'CV yaratuvchi — IshBor.uz',
  "Professional rezyume tuzing va yuklab oling."
)

export default function CvBuilderRoute() {
  return <CvBuilderPage />
}
