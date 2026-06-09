'use client'

import { useEffect, useId, useRef } from 'react'
import { getSupabase, isSupabaseConfigured } from '@/infrastructure/supabase/client'

/** Refresh notification UI when a new row is inserted for the current user. */
export function useNotificationsRealtime(userId: string | null | undefined, onRefresh: () => void) {
  const onRefreshRef = useRef(onRefresh)
  const listenerId = useId().replace(/:/g, '')

  useEffect(() => {
    onRefreshRef.current = onRefresh
  }, [onRefresh])

  useEffect(() => {
    if (!userId || !isSupabaseConfigured()) return

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
        () => {
          onRefreshRef.current()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId, listenerId])
}
