'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/infrastructure/api/client'
import { queryKeys } from '@/shared/lib/query-keys'

const EMPTY_STATS = { average: 0, count: 0 }

export function useDashboardReviews(role: 'freelancer' | 'client', enabled = true) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.dashboardReviews(role),
    queryFn: async () => {
      const raw = await api.getDashboardReviews(role)
      return { reviews: raw.reviews, stats: raw.stats }
    },
    enabled,
  })

  return {
    reviews: query.data?.reviews ?? [],
    stats: query.data?.stats ?? EMPTY_STATS,
    loading: query.isLoading,
    error: query.isError,
    loadError: query.error ?? null,
    reload: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboardReviews(role) })
      if (role === 'freelancer') {
        void queryClient.invalidateQueries({ queryKey: queryKeys.dashboardHome('freelancer') })
      }
    },
    refetch: () => void query.refetch(),
  }
}
