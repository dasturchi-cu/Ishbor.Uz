'use client'

import { useEffect, useId, useRef } from 'react'
import { getSupabase, isSupabaseConfigured } from '@/infrastructure/supabase/client'
import { trackSupabaseRequest } from '@/shared/lib/supabase-request-debug'

const DEBOUNCE_MS = 400

/** Yangi yoki yangilangan bildirishnomalarda UI ni yangilash (debounced). */
export function useNotificationsRealtime(userId: string | null | undefined, onRefresh: () => void) {
  const onRefreshRef = useRef(onRefresh)
  const listenerId = useId().replace(/:/g, '')
  const component = `use-notifications-realtime:${listenerId}`

  useEffect(() => {
    onRefreshRef.current = onRefresh
  }, [onRefresh])

  useEffect(() => {
    if (!userId || !isSupabaseConfigured()) return

    let timer: ReturnType<typeof setTimeout> | null = null
    const scheduleRefresh = () => {
      trackSupabaseRequest({
        queryName: 'realtime.trigger:notifications',
        component,
        kind: 'realtime_event',
      })
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => onRefreshRef.current(), DEBOUNCE_MS)
    }

    const supabase = getSupabase()
    const channel = supabase
      .channel(`notifications-${userId}-${listenerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        scheduleRefresh
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        scheduleRefresh
      )
      .subscribe()

    return () => {
      if (timer) clearTimeout(timer)
      void supabase.removeChannel(channel)
    }
  }, [userId, listenerId])
}
