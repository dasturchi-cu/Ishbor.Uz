'use client'

import { useEffect, useId, useRef } from 'react'
import { getSupabase, isSupabaseConfigured } from '@/infrastructure/supabase/client'
import { trackSupabaseRequest } from '@/shared/lib/supabase-request-debug'

const DEBOUNCE_MS = 400

/** Inbox yangilash — yangi xabar kelganda debounced refresh. */
export function useInboxRealtime(userId: string | null | undefined, onRefresh: () => void) {
  const onRefreshRef = useRef(onRefresh)
  const listenerId = useId().replace(/:/g, '')

  useEffect(() => {
    onRefreshRef.current = onRefresh
  }, [onRefresh])

  const component = `use-inbox-realtime:${listenerId}`

  useEffect(() => {
    if (!userId || !isSupabaseConfigured()) return

    let timer: ReturnType<typeof setTimeout> | null = null
    const scheduleRefresh = () => {
      trackSupabaseRequest({
        queryName: 'realtime.trigger:inbox',
        component,
        kind: 'realtime_event',
      })
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => onRefreshRef.current(), DEBOUNCE_MS)
    }

    const supabase = getSupabase()
    const channel = supabase
      .channel(`inbox-${userId}-${listenerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        scheduleRefresh
      )
      .subscribe()

    return () => {
      if (timer) clearTimeout(timer)
      void supabase.removeChannel(channel)
    }
  }, [userId, listenerId, component])
}
