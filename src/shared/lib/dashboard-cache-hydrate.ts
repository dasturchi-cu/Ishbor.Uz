'use client'

import type { QueryClient } from '@tanstack/react-query'
import {
  readDashboardSummaryCache,
  readDashboardSummaryCacheUpdatedAt,
  type DashboardSummaryPayload,
} from '@/shared/lib/dashboard-summary-cache'
import { queryKeys } from '@/shared/lib/query-keys'
import type { DashboardHomeData } from '@/shared/lib/use-dashboard-home'

export function summaryToHomeData(summary: DashboardSummaryPayload): DashboardHomeData {
  return {
    orders: summary.orders,
    services: summary.services,
    projects: summary.projects,
    reviewStats: summary.review_stats,
    reputation: summary.reputation,
  }
}

/** sessionStorage / React Query — API chaqirmasdan dashboard cache to'ldirish */
export function hydrateDashboardCaches(
  queryClient: QueryClient,
  userId: string,
  role: 'freelancer' | 'client'
): boolean {
  const summaryKey = queryKeys.dashboardSummary(role)
  const homeKey = queryKeys.dashboardHome(role)
  const hasSummary = queryClient.getQueryData(summaryKey) !== undefined
  const hasHome = queryClient.getQueryData(homeKey) !== undefined

  const fromStorage = readDashboardSummaryCache(userId, role)
  const updatedAt = readDashboardSummaryCacheUpdatedAt(userId, role)

  if (fromStorage) {
    if (!hasSummary) {
      queryClient.setQueryData(summaryKey, fromStorage, { updatedAt })
    }
    if (!hasHome) {
      queryClient.setQueryData(homeKey, summaryToHomeData(fromStorage), { updatedAt })
    }
    if (queryClient.getQueryData(queryKeys.dashboardBadges) === undefined) {
      queryClient.setQueryData(queryKeys.dashboardBadges, fromStorage.badges, { updatedAt })
    }
    return true
  }

  return hasSummary || hasHome
}
