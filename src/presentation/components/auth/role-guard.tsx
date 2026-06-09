'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import {
  dashboardPathForRole,
  isClientOnlyDashboardPath,
  isFreelancerOnlyDashboardPath,
  PATHS,
} from '@/domain/constants/routes'

export function RoleGuard({ children }: { children: React.ReactNode }) {
  const { currentUserRole, isAuthLoading } = useApp()
  const pathname = usePathname()
  const router = useRouter()
  const role = currentUserRole

  useEffect(() => {
    if (isAuthLoading) return

    if (pathname === PATHS.dashboardFreelancer && role === 'client') {
      router.replace(PATHS.dashboardClient)
      return
    }
    if (pathname === PATHS.dashboardClient && role === 'freelancer') {
      router.replace(PATHS.dashboardFreelancer)
      return
    }
    if (role === 'client' && isFreelancerOnlyDashboardPath(pathname)) {
      router.replace(PATHS.dashboardClient)
      return
    }
    if (role === 'freelancer' && isClientOnlyDashboardPath(pathname)) {
      router.replace(PATHS.dashboardFreelancer)
    }
  }, [isAuthLoading, pathname, role, router])

  if (isAuthLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-[var(--ishbor-text-muted)]">
        ...
      </div>
    )
  }

  return <>{children}</>
}

export function useDashboardRole() {
  const { currentUserRole } = useApp()
  return currentUserRole
}

export function useDashboardHomePath() {
  const role = useDashboardRole()
  return dashboardPathForRole(role)
}
