import { AuthGuard } from '@/presentation/components/auth/auth-guard'
import { CreateServicePage } from '@/presentation/features/catalog/create-service'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Xizmat yaratish — IshBor.uz',
  description: 'Freelancer sifatida yangi xizmat e\'lon qiling',
}

export default function CreateServiceRoute() {
  return (
    <AuthGuard>
      <CreateServicePage />
    </AuthGuard>
  )
}
