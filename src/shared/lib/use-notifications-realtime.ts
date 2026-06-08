'use client'

import { useEffect } from 'react'
import { getSupabase, isSupabaseConfigured } from '@/infrastructure/supabase/client'

/** Refresh notification UI when a new row is inserted for the current user. */
export function useNotificationsRealtime(userId: string | null | undefined, onRefresh: () => void) {
  useEffect(() => {
    if (!userId || !isSupabaseConfigured()) return

    const supabase = getSupabase()
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => onRefresh()
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId, onRefresh])
}
