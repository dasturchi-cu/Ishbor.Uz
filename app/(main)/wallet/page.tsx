import { AuthGuard } from '@/presentation/components/auth/auth-guard'
import { WalletPage } from '@/presentation/features/wallet/wallet-page'

export default function WalletRoute() {
  return (
    <AuthGuard>
      <WalletPage />
    </AuthGuard>
  )
}
