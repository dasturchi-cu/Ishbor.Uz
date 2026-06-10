'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { api } from '@/infrastructure/api/client'
import { hydrateDashboardCaches } from '@/shared/lib/dashboard-cache-hydrate'
import { queryKeys } from '@/shared/lib/query-keys'
import { wrapQueryFn } from '@/shared/lib/request-debug'

function isDashboardHomePath(pathname: string): boolean {
  return (
    pathname === '/dashboard' ||
    pathname === '/dashboard/client' ||
    pathname === '/dashboard/freelancer'
  )
}

function isDashboardPath(pathname: string): boolean {
  return pathname === '/dashboard' || pathname.startsWith('/dashboard/')
}

export function useDashboardBadges(enabled = true) {
  const pathname = usePathname()
  const { userId, isLoggedIn, currentUserRole } = useApp()
  const queryClient = useQueryClient()

  if (isDashboardPath(pathname) && userId) {
    hydrateDashboardCaches(
      queryClient,
      userId,
      currentUserRole === 'client' ? 'client' : 'freelancer'
    )
  }

  const cached = queryClient.getQueryData<{ message_unread: number; notification_unread: number }>(
    queryKeys.dashboardBadges
  )
  const onHome = isDashboardHomePath(pathname)

  const { data } = useQuery({
    queryKey: queryKeys.dashboardBadges,
    queryFn: wrapQueryFn('dashboard/badges', () => api.getDashboardBadges(), {
      queryKey: 'dashboard/badges',
    }),
    enabled: enabled && isLoggedIn && Boolean(userId) && !onHome && cached === undefined,
    staleTime: 60_000,
    refetchOnMount: false,
  })

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboardBadges })
  }, [queryClient])

  const resolved = data ?? cached

  return {
    messageUnread: resolved?.message_unread ?? 0,
    notificationUnread: resolved?.notification_unread ?? 0,
    invalidate,
  }
}
