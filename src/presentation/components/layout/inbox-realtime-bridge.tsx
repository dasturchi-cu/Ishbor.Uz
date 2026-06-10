'use client'

import { useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useApp } from '@/application/providers/app-provider'
import { PATHS } from '@/domain/constants/routes'
import { queryKeys } from '@/shared/lib/query-keys'
import { debouncedInvalidateQueries } from '@/shared/lib/query-invalidate-debounce'
import { useInboxRealtime } from '@/shared/lib/use-inbox-realtime'
import { trackSupabaseRequest } from '@/shared/lib/supabase-request-debug'

function isMessagesPath(pathname: string): boolean {
  return (
    pathname === PATHS.messages ||
    pathname === PATHS.dashboardMessages ||
    pathname.startsWith(`${PATHS.dashboardMessages}/`)
  )
}

/** Bitta inbox realtime — badges + (faqat chat sahifasida) inbox cache yangilash. */
export function InboxRealtimeBridge() {
  const pathname = usePathname()
  const { userId, isLoggedIn } = useApp()
  const queryClient = useQueryClient()
  const onMessagesPage = isMessagesPath(pathname)

  const onInboxChange = useCallback(() => {
    trackSupabaseRequest({
      queryName: onMessagesPage ? 'invalidate:inbox-badges+messages' : 'invalidate:inbox-badges',
      component: 'inbox-realtime-bridge',
      kind: 'invalidate',
    })
    debouncedInvalidateQueries(queryClient, queryKeys.dashboardBadges)
    if (onMessagesPage) {
      debouncedInvalidateQueries(queryClient, queryKeys.messagesInbox)
    }
  }, [queryClient, onMessagesPage])

  useInboxRealtime(isLoggedIn ? userId : null, onInboxChange)

  return null
}
