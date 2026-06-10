'use client'

import { useEffect, useRef } from 'react'
import { getSupabase, isSupabaseConfigured } from '@/infrastructure/supabase/client'
import type { ApiMessage } from '@/infrastructure/api/types'
import { logRealtimeSubscriptionError } from '@/shared/lib/realtime-error'

export function useConversationMessagesRealtime(
  conversationId: string | null,
  onInsert: (message: ApiMessage) => void,
  onUpdate?: (message: ApiMessage) => void
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
    if (!conversationId || !isSupabaseConfigured()) return

    const supabase = getSupabase()
    const channel = supabase
      .channel(`conversation-messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          onInsertRef.current(payload.new as ApiMessage)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          onUpdateRef.current?.(payload.new as ApiMessage)
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          logRealtimeSubscriptionError(`conversation-messages-${conversationId}`, status, {
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          })
        }
      })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [conversationId])
}
