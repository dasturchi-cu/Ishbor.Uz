'use client'

import '@/presentation/styles/route-dashboard.css'
import '@/presentation/styles/product-system.css'
import '@/presentation/styles/premium-design-system.css'
import '@/presentation/styles/perfection-pass.css'
import { Suspense } from 'react'
import { AuthGuard } from '@/presentation/components/auth/auth-guard'
import { OnboardingGuard } from '@/presentation/components/auth/onboarding-guard'
import { RoleGuard } from '@/presentation/components/auth/role-guard'
import { DashboardLayout } from '@/presentation/components/layout/dashboard-layout'
import { AdminDeniedToast } from '@/presentation/components/layout/admin-denied-toast'

export function DashboardRouteShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <OnboardingGuard>
        <RoleGuard>
          <Suspense fallback={null}>
            <AdminDeniedToast />
          </Suspense>
          <DashboardLayout>{children}</DashboardLayout>
        </RoleGuard>
      </OnboardingGuard>
    </AuthGuard>
  )
}
