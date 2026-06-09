'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { api } from '@/infrastructure/api/client'
import type { ApiNotification } from '@/infrastructure/api/types'
import { queryKeys } from '@/shared/lib/query-keys'
import { applyReadState } from '@/shared/lib/notification-reads'
import { useNotificationsRealtime } from '@/shared/lib/use-notifications-realtime'
import { useAuthReady } from '@/shared/lib/use-auth-ready'
import { wrapQueryFn } from '@/shared/lib/request-debug'
import { trackSupabaseRequest } from '@/shared/lib/supabase-request-debug'

export function useNotificationsQuery(userId: string | null | undefined, enabled = true) {
  const { ready, authed } = useAuthReady()
  const queryClient = useQueryClient()

  const invalidate = useCallback(() => {
    trackSupabaseRequest({
      queryName: 'invalidate:notifications+badges',
      component: 'use-notifications-query',
      kind: 'invalidate',
    })
    void queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboardBadges })
  }, [queryClient])

  const canFetch = enabled && ready && authed && Boolean(userId)

  useNotificationsRealtime(canFetch ? userId : null, invalidate)

  const query = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: wrapQueryFn('notifications/list', async () => {
      const rows = await api.listNotifications()
      return applyReadState(rows)
    }),
    enabled: canFetch,
    staleTime: 60_000,
  })

  return {
    notifications: query.data ?? ([] as ApiNotification[]),
    loading: !ready || query.isLoading,
    error: query.isError,
    loadError: query.error ?? null,
    refresh: invalidate,
    refetch: () => void query.refetch(),
  }
}
