'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useLayoutEffect, useMemo } from 'react'
import { useApp } from '@/application/providers/app-provider'
import type { ApiOrder, ApiProject, ApiService, ApiUserReputation } from '@/infrastructure/api/types'
import { hydrateDashboardCaches, summaryToHomeData } from '@/shared/lib/dashboard-cache-hydrate'
import {
  readDashboardSummaryCache,
  readDashboardSummaryCacheUpdatedAt,
} from '@/shared/lib/dashboard-summary-cache'
import { fetchDashboardSummary } from '@/shared/lib/prefetch-dashboard-summary'
import { queryKeys } from '@/shared/lib/query-keys'
import { wrapQueryFn } from '@/shared/lib/request-debug'
import type { DashboardHomeData } from '@/shared/lib/use-dashboard-home'

const EMPTY: DashboardHomeData = {
  orders: [],
  services: [],
  projects: [],
  reviewStats: { average: 0, count: 0 },
  reputation: null,
}

export function useDashboardSummary(
  userId: string | null,
  role: 'freelancer' | 'client',
  enabled = true
) {
  const { mergeProfile, profile } = useApp()
  const queryClient = useQueryClient()

  const cachedSummary = useMemo(
    () => (userId ? readDashboardSummaryCache(userId, role) : undefined),
    [userId, role]
  )
  const cachedUpdatedAt = useMemo(
    () => (userId ? readDashboardSummaryCacheUpdatedAt(userId, role) : undefined),
    [userId, role]
  )

  useLayoutEffect(() => {
    if (!userId) return
    hydrateDashboardCaches(queryClient, userId, role)
  }, [queryClient, userId, role])

  const { data, isPending, isFetching, isError, error, refetch } = useQuery({
    queryKey: queryKeys.dashboardSummary(role),
    queryFn: wrapQueryFn(
      `dashboard/summary:${role}`,
      async () => {
        const summary = await fetchDashboardSummary(userId!, role)
        queryClient.setQueryData(queryKeys.dashboardBadges, summary.badges)
        queryClient.setQueryData(queryKeys.dashboardHome(role), summaryToHomeData(summary))
        return summary
      },
      { queryKey: `dashboard/summary:${role}` }
    ),
    enabled: enabled && Boolean(userId),
    initialData: cachedSummary,
    initialDataUpdatedAt: cachedUpdatedAt,
    staleTime: 60_000,
    refetchOnMount: false,
    retry: 1,
  })

  useEffect(() => {
    if (!data?.profile) return
    const wallet = data.profile.wallet_balance
    if (wallet !== undefined && wallet !== null && profile?.wallet_balance !== wallet) {
      mergeProfile({ wallet_balance: wallet })
    }
  }, [data?.profile, profile?.wallet_balance, mergeProfile])

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary(role) })
  }, [queryClient, role])

  return {
    ...(data
      ? {
          orders: data.orders as ApiOrder[],
          services: data.services as ApiService[],
          projects: data.projects as ApiProject[],
          reviewStats: data.review_stats,
          reputation: data.reputation as ApiUserReputation | null,
        }
      : EMPTY),
    loading: isPending && data === undefined,
    refreshing: isFetching && data !== undefined,
    error: isError,
    loadError: error ?? null,
    reload: invalidate,
    refresh: () => void refetch(),
  }
}
