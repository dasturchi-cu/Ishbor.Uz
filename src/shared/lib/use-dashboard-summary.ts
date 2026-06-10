'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo } from 'react'
import { useApp } from '@/application/providers/app-provider'
import { api } from '@/infrastructure/api/client'
import type { ApiOrder, ApiProject, ApiService, ApiUserReputation } from '@/infrastructure/api/types'
import { summaryToHomeData } from '@/shared/lib/dashboard-cache-hydrate'
import {
  readDashboardSummaryCache,
  readDashboardSummaryCacheUpdatedAt,
  writeDashboardSummaryCache,
} from '@/shared/lib/dashboard-summary-cache'
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

  const { data, isPending, isFetching, isError, error, refetch } = useQuery({
    queryKey: queryKeys.dashboardSummary(role),
    queryFn: wrapQueryFn(
      `dashboard/summary:${role}`,
      async () => {
        const summary = await api.getDashboardSummary(role)
        if (userId) writeDashboardSummaryCache(userId, role, summary)
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
    const wallet = data?.profile?.wallet_balance
    if (wallet === undefined || wallet === null) return
    if (profile?.wallet_balance !== wallet) {
      mergeProfile({ wallet_balance: wallet })
    }
  }, [data?.profile?.wallet_balance, profile?.wallet_balance, mergeProfile])

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
