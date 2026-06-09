'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { LoadingBlock } from '@/presentation/components/ui/loading-block'
import { dashboardPathForRole, PATHS } from '@/domain/constants/routes'

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { t, profile, isAuthLoading, isLoggedIn, currentUserRole, refreshProfile } = useApp()
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    if (isAuthLoading || !isLoggedIn || profile || profileLoading) return
    setProfileLoading(true)
    refreshProfile().finally(() => setProfileLoading(false))
  }, [isAuthLoading, isLoggedIn, profile, profileLoading, refreshProfile])

  const profileReady = !isAuthLoading && !profileLoading && (!isLoggedIn || profile !== null)

  if (!profileReady) {
    return (
      <div className="admin-shell flex min-h-screen items-center justify-center">
        <LoadingBlock />
      </div>
    )
  }

  if (!profile?.is_admin) {
    return (
      <div className="admin-shell flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold text-[var(--admin-text)]">{t('admin_panel')}</h1>
        <p className="max-w-md text-[var(--admin-muted)]">{t('admin_access_denied')}</p>
        <p className="text-sm text-[var(--admin-muted)]">{t('admin_name_not_role')}</p>
        {profile?.email && (
          <p className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-xs text-[var(--admin-muted)]">
            {t('admin_setup_sql_hint').replace('{email}', profile.email)}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          <Link href={PATHS.home}>
            <Button variant="outline">{t('nav_home')}</Button>
          </Link>
          <Link href={dashboardPathForRole(currentUserRole)}>
            <Button variant="primary">{t('nav_dashboard')}</Button>
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
