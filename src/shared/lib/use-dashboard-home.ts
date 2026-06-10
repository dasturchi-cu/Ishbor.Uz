'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { api } from '@/infrastructure/api/client'
import type { ApiOrder, ApiProject, ApiService, ApiUserReputation } from '@/infrastructure/api/types'
import { summaryToHomeData } from '@/shared/lib/dashboard-cache-hydrate'
import {
  clearDashboardSummaryCache,
  readDashboardSummaryCache,
  readDashboardSummaryCacheUpdatedAt,
} from '@/shared/lib/dashboard-summary-cache'
import { queryKeys } from '@/shared/lib/query-keys'
import { wrapQueryFn } from '@/shared/lib/request-debug'

export interface DashboardHomeData {
  orders: ApiOrder[]
  services: ApiService[]
  projects: ApiProject[]
  reviewStats: { average: number; count: number }
  reputation: ApiUserReputation | null
}

const EMPTY: DashboardHomeData = {
  orders: [],
  services: [],
  projects: [],
  reviewStats: { average: 0, count: 0 },
  reputation: null,
}

export function useDashboardHome(
  userId: string | null,
  role: 'freelancer' | 'client',
  enabled = true
) {
  const queryClient = useQueryClient()

  const cachedHome = queryClient.getQueryData<DashboardHomeData>(queryKeys.dashboardHome(role))
  const cachedSummary = useMemo(
    () => (userId ? readDashboardSummaryCache(userId, role) : undefined),
    [userId, role]
  )
  const cachedUpdatedAt = useMemo(
    () => (userId ? readDashboardSummaryCacheUpdatedAt(userId, role) : undefined),
    [userId, role]
  )
  const initialHome = cachedHome ?? (cachedSummary ? summaryToHomeData(cachedSummary) : undefined)
  const hasWarmCache = cachedHome !== undefined || cachedSummary !== undefined

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.dashboardHome(role),
    queryFn: wrapQueryFn(
      `dashboard/overview:${role}`,
      async () => {
        const overview = await api.getDashboardOverview(role)
        queryClient.setQueryData(queryKeys.dashboardBadges, overview.badges)
        return {
          orders: overview.orders,
          services: overview.services,
          projects: overview.projects,
          reviewStats: overview.review_stats,
          reputation: overview.reputation,
        } satisfies DashboardHomeData
      },
      { queryKey: `dashboard/home:${role}` }
    ),
    enabled: enabled && Boolean(userId) && !hasWarmCache,
    initialData: initialHome,
    initialDataUpdatedAt: cachedUpdatedAt,
    staleTime: 60_000,
    refetchOnMount: false,
  })

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboardHome(role) })
  }, [queryClient, role])

  return {
    ...(data ?? EMPTY),
    loading: isLoading,
    error: isError,
    loadError: error ?? null,
    reload: invalidate,
    refresh: () => void refetch(),
  }
}

export function clearDashboardHomeCache(_userId?: string) {
  clearDashboardSummaryCache()
}
