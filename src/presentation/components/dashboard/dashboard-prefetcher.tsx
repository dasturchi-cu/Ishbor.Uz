'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useLayoutEffect } from 'react'
import { useApp } from '@/application/providers/app-provider'
import { prefetchDashboardSummary } from '@/shared/lib/prefetch-dashboard-summary'

/** Login bo'lganda dashboard summary ni oldindan yuklash — /dashboard ochilganda skeleton qisqaradi */
export function DashboardPrefetcher() {
  const { userId, isLoggedIn, isAuthLoading, currentUserRole } = useApp()
  const queryClient = useQueryClient()

  useLayoutEffect(() => {
    if (isAuthLoading || !isLoggedIn || !userId) return
    const role = currentUserRole === 'client' ? 'client' : 'freelancer'

    const run = () => prefetchDashboardSummary(queryClient, userId, role)
    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(run, { timeout: 4000 })
      return () => cancelIdleCallback(id)
    }
    const id = window.setTimeout(run, 1200)
    return () => window.clearTimeout(id)
  }, [isAuthLoading, isLoggedIn, userId, currentUserRole, queryClient])

  return null
}
