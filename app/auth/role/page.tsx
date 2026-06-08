import { Suspense } from 'react'
import { AuthRolePage } from '@/presentation/features/auth/auth-role-page'

export default function AuthRoleRoute() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">...</div>}>
      <AuthRolePage />
    </Suspense>
  )
}
