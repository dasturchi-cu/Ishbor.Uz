import { AuthGuard } from '@/presentation/components/auth/auth-guard'
import { PostProject } from '@/presentation/features/project/post-project'

export default function PostProjectRoute() {
  return (
    <AuthGuard>
      <PostProject />
    </AuthGuard>
  )
}
