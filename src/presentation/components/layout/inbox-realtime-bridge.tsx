'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useApp } from '@/application/providers/app-provider'
import { queryKeys } from '@/shared/lib/query-keys'
import { useInboxRealtime } from '@/shared/lib/use-inbox-realtime'
import { trackSupabaseRequest } from '@/shared/lib/supabase-request-debug'

/** Bitta inbox realtime — badges + messages inbox cache yangilash. */
export function InboxRealtimeBridge() {
  const { userId, isLoggedIn } = useApp()
  const queryClient = useQueryClient()

  useInboxRealtime(isLoggedIn ? userId : null, () => {
    trackSupabaseRequest({
      queryName: 'invalidate:inbox-badges+messages',
      component: 'inbox-realtime-bridge',
      kind: 'invalidate',
    })
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboardBadges })
    void queryClient.invalidateQueries({ queryKey: queryKeys.messagesInbox })
  })

  return null
}
