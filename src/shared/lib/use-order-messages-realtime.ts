'use client'

import { useEffect } from 'react'
import { getSupabase, isSupabaseConfigured } from '@/infrastructure/supabase/client'
import type { ApiMessage } from '@/infrastructure/api/types'

export function useOrderMessagesRealtime(
  orderId: string | null,
  onInsert: (message: ApiMessage) => void,
  onUpdate?: (message: ApiMessage) => void,
) {
  useEffect(() => {
    if (!orderId || !isSupabaseConfigured()) return

    const supabase = getSupabase()
    const channel = supabase
      .channel(`order-messages-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          onInsert(payload.new as ApiMessage)
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          if (onUpdate) onUpdate(payload.new as ApiMessage)
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[realtime] messages subscription failed:', status)
        }
      })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [orderId, onInsert, onUpdate])
}
