'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useApp } from '@/application/providers/app-provider'
import { api } from '@/infrastructure/api/client'
import { queryKeys } from '@/shared/lib/query-keys'
import { useInboxRealtime } from '@/shared/lib/use-inbox-realtime'
import { wrapQueryFn } from '@/shared/lib/request-debug'
import { trackSupabaseRequest } from '@/shared/lib/supabase-request-debug'

export function useDashboardBadges(enabled = true) {
  const { userId, isLoggedIn } = useApp()
  const queryClient = useQueryClient()

  const invalidateBadges = useCallback(() => {
    trackSupabaseRequest({
      queryName: 'invalidate:dashboard/badges',
      component: 'use-dashboard-badges',
      kind: 'invalidate',
    })
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboardBadges })
  }, [queryClient])

  useInboxRealtime(userId, invalidateBadges)

  const { data } = useQuery({
    queryKey: queryKeys.dashboardBadges,
    queryFn: wrapQueryFn('dashboard/badges', () => api.getDashboardBadges(), {
      queryKey: 'dashboard/badges',
    }),
    enabled: enabled && isLoggedIn && Boolean(userId),
    staleTime: 60_000,
    refetchOnMount: false,
  })

  const invalidate = useCallback(() => {
    invalidateBadges()
  }, [invalidateBadges])

  return {
    messageUnread: data?.message_unread ?? 0,
    notificationUnread: data?.notification_unread ?? 0,
    invalidate,
  }
}
