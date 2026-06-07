import { AuthGuard } from '@/presentation/components/auth/auth-guard'
import { ProfileSettings } from '@/presentation/features/profile/profile-settings'

export default function SettingsRoute() {
  return (
    <AuthGuard>
      <ProfileSettings />
    </AuthGuard>
  )
}
