'use client'

import type { QueryClient } from '@tanstack/react-query'
import { api } from '@/infrastructure/api/client'
import { summaryToHomeData } from '@/shared/lib/dashboard-cache-hydrate'
import { hydrateDashboardCaches } from '@/shared/lib/dashboard-cache-hydrate'
import {
  readDashboardSummaryCache,
  writeDashboardSummaryCache,
} from '@/shared/lib/dashboard-summary-cache'
import { queryKeys } from '@/shared/lib/query-keys'
import { wrapQueryFn } from '@/shared/lib/request-debug'

export async function fetchDashboardSummary(
  userId: string,
  role: 'freelancer' | 'client'
) {
  const summary = await api.getDashboardSummary(role)
  writeDashboardSummaryCache(userId, role, summary)
  return summary
}

export function prefetchDashboardSummary(
  queryClient: QueryClient,
  userId: string,
  role: 'freelancer' | 'client'
): void {
  hydrateDashboardCaches(queryClient, userId, role)
  if (readDashboardSummaryCache(userId, role)) return

  const queryKey = queryKeys.dashboardSummary(role)
  if (queryClient.getQueryState(queryKey)?.fetchStatus === 'fetching') return

  void queryClient.prefetchQuery({
    queryKey,
    queryFn: wrapQueryFn(
      `dashboard/summary:${role}`,
      async () => {
        const summary = await fetchDashboardSummary(userId, role)
        queryClient.setQueryData(queryKeys.dashboardBadges, summary.badges)
        queryClient.setQueryData(queryKeys.dashboardHome(role), summaryToHomeData(summary))
        return summary
      },
      { queryKey: `dashboard/summary:${role}` }
    ),
    staleTime: 60_000,
  })
}
