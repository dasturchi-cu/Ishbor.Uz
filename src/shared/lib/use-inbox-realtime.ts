'use client'

import { useEffect } from 'react'
import { getSupabase, isSupabaseConfigured } from '@/infrastructure/supabase/client'

/** Refresh inbox when any message arrives for the current user. */
export function useInboxRealtime(userId: string | null | undefined, onRefresh: () => void) {
  useEffect(() => {
    if (!userId || !isSupabaseConfigured()) return

    const supabase = getSupabase()
    const channel = supabase
      .channel(`inbox-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        () => onRefresh()
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId, onRefresh])
}
