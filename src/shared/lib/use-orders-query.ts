'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/infrastructure/api/client'
import type { ApiOrder } from '@/infrastructure/api/types'
import { queryKeys } from '@/shared/lib/query-keys'
import type { DashboardHomeData } from '@/shared/lib/use-dashboard-home'

function ordersFromHomeCache(queryClient: ReturnType<typeof useQueryClient>): ApiOrder[] | undefined {
  for (const role of ['freelancer', 'client'] as const) {
    const home = queryClient.getQueryData<DashboardHomeData>(queryKeys.dashboardHome(role))
    if (home?.orders?.length) return home.orders
  }
  return undefined
}

function homeCacheUpdatedAt(queryClient: ReturnType<typeof useQueryClient>): number | undefined {
  const freelancer = queryClient.getQueryState(queryKeys.dashboardHome('freelancer'))?.dataUpdatedAt
  const client = queryClient.getQueryState(queryKeys.dashboardHome('client'))?.dataUpdatedAt
  const max = Math.max(freelancer ?? 0, client ?? 0)
  return max > 0 ? max : undefined
}

export function useOrdersQuery(enabled = true) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.orders(),
    queryFn: () => api.listOrders(),
    enabled,
    initialData: () => ordersFromHomeCache(queryClient),
    initialDataUpdatedAt: () => homeCacheUpdatedAt(queryClient),
  })

  return {
    orders: query.data ?? [],
    loading: query.isLoading,
    error: query.isError,
    loadError: query.error ?? null,
    reload: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders() })
      void queryClient.invalidateQueries({ queryKey: ['dashboard', 'home'] })
    },
    refetch: () => void query.refetch(),
  }
}
