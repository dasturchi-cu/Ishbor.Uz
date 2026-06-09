'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useApp } from '@/application/providers/app-provider'
import { api } from '@/infrastructure/api/client'
import type { ApiOrder, ApiProject, ApiService, ApiUserReputation } from '@/infrastructure/api/types'
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
  const { mergeProfile } = useApp()
  const queryClient = useQueryClient()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.dashboardSummary(role),
    queryFn: wrapQueryFn(
      `dashboard/summary:${role}`,
      async () => {
        const summary = await api.getDashboardSummary(role)
        queryClient.setQueryData(queryKeys.dashboardBadges, summary.badges)
        queryClient.setQueryData(queryKeys.dashboardHome(role), {
          orders: summary.orders,
          services: summary.services,
          projects: summary.projects,
          reviewStats: summary.review_stats,
          reputation: summary.reputation,
        } satisfies DashboardHomeData)
        mergeProfile(summary.profile)
        return summary
      },
      { queryKey: `dashboard/summary:${role}` }
    ),
    enabled: enabled && Boolean(userId),
    staleTime: 60_000,
    refetchOnMount: false,
  })

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
    loading: isLoading,
    error: isError,
    loadError: error ?? null,
    reload: invalidate,
    refresh: () => void refetch(),
  }
}
