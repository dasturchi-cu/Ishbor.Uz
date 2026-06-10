'use client'

import { useEffect, useRef } from 'react'
import { getSupabase, isSupabaseConfigured } from '@/infrastructure/supabase/client'
import type { ApiMessage } from '@/infrastructure/api/types'
import { logRealtimeSubscriptionError } from '@/shared/lib/realtime-error'

export function useOrderMessagesRealtime(
  orderId: string | null,
  onInsert: (message: ApiMessage) => void,
  onUpdate?: (message: ApiMessage) => void,
) {
  const onInsertRef = useRef(onInsert)
  const onUpdateRef = useRef(onUpdate)

  useEffect(() => {
    onInsertRef.current = onInsert
  }, [onInsert])

  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

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
          onInsertRef.current(payload.new as ApiMessage)
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
          onUpdateRef.current?.(payload.new as ApiMessage)
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          logRealtimeSubscriptionError(`order-messages-${orderId}`, status, {
            table: 'messages',
            filter: `order_id=eq.${orderId}`,
          })
        }
      })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [orderId])
}
