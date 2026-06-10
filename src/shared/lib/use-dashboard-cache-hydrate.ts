'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { hydrateDashboardCaches } from '@/shared/lib/dashboard-cache-hydrate'

/** Dashboard layout: sessionStorage → React Query (0 API, navigation <500ms) */
export function useDashboardCacheHydrate(
  userId: string | null | undefined,
  role: 'freelancer' | 'client'
) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return
    hydrateDashboardCaches(queryClient, userId, role)
  }, [queryClient, userId, role])
}
