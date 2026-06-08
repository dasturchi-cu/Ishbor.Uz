import { AuthGuard } from '@/presentation/components/auth/auth-guard'
import { PostProject } from '@/presentation/features/project/post-project'
import { buildPageMetadata } from '@/shared/lib/seo'

export const metadata = buildPageMetadata(
  '/post-project',
  "Loyiha e'lon qilish — IshBor.uz",
  "Yangi loyiha e'lon qiling va freelancerlardan taklif oling."
)

export default function PostProjectRoute() {
  return (
    <AuthGuard>
      <PostProject />
    </AuthGuard>
  )
}
