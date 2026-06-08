import { BlogPage } from '@/presentation/features/blog/blog-page'
import { buildPageMetadata } from '@/shared/lib/seo'

export const metadata = buildPageMetadata(
  '/blog',
  'Blog — IshBor.uz',
  "Freelance, to'lovlar va marketplace haqida foydali maqolalar."
)

export default function BlogRoutePage() {
  return <BlogPage />
}
