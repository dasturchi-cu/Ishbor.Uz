'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usePathname } from 'next/navigation'
import { api } from '@/infrastructure/api/client'
import type { ApiNotification } from '@/infrastructure/api/types'
import { PATHS } from '@/domain/constants/routes'
import { queryKeys } from '@/shared/lib/query-keys'
import { applyReadState } from '@/shared/lib/notification-reads'
import { useNotificationsRealtime } from '@/shared/lib/use-notifications-realtime'
import { useAuthReady } from '@/shared/lib/use-auth-ready'
import { wrapQueryFn } from '@/shared/lib/request-debug'
import { trackSupabaseRequest } from '@/shared/lib/supabase-request-debug'

type NotificationsContextValue = {
  notifications: ApiNotification[]
  loading: boolean
  error: boolean
  loadError: unknown
  ensureLoaded: () => void
  refresh: () => void
  refetch: () => void
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null)

function browserNotifWantsFeed(): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  return Notification.permission === 'granted'
}

export function NotificationsProvider({
  userId,
  isLoggedIn,
  children,
}: {
  userId: string | null
  isLoggedIn: boolean
  children: ReactNode
}) {
  const pathname = usePathname()
  const { ready, authed } = useAuthReady()
  const queryClient = useQueryClient()
  const [forced, setForced] = useState(false)

  const onNotificationsPage = pathname === PATHS.notifications || pathname.startsWith(`${PATHS.notifications}/`)
  const shouldLoad =
    forced ||
    onNotificationsPage ||
    (isLoggedIn && browserNotifWantsFeed())

  const canFetch = isLoggedIn && ready && authed && Boolean(userId) && shouldLoad

  const invalidate = useCallback(() => {
    trackSupabaseRequest({
      queryName: 'invalidate:notifications+badges',
      component: 'notifications-provider',
      kind: 'invalidate',
    })
    void queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboardBadges })
  }, [queryClient])

  useNotificationsRealtime(isLoggedIn ? userId : null, invalidate)

  const query = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: wrapQueryFn('notifications/list', async () => {
      const rows = await api.listNotifications()
      return applyReadState(rows)
    }),
    enabled: canFetch,
    staleTime: 60_000,
    refetchOnMount: false,
  })

  const ensureLoaded = useCallback(() => {
    setForced(true)
  }, [])

  useEffect(() => {
    if (!isLoggedIn || !browserNotifWantsFeed()) return
    setForced(true)
  }, [isLoggedIn])

  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifications: query.data ?? [],
      loading: canFetch && query.isLoading,
      error: query.isError,
      loadError: query.error ?? null,
      ensureLoaded,
      refresh: invalidate,
      refetch: () => void query.refetch(),
    }),
    [query.data, query.isLoading, query.isError, query.error, canFetch, ensureLoaded, invalidate, query]
  )

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotificationsFeed(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext)
  if (!ctx) {
    throw new Error('useNotificationsFeed must be used within NotificationsProvider')
  }
  return ctx
}
