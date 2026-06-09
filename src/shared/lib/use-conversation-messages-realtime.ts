'use client'

import { useEffect } from 'react'
import { getSupabase, isSupabaseConfigured } from '@/infrastructure/supabase/client'
import type { ApiMessage } from '@/infrastructure/api/types'

export function useConversationMessagesRealtime(
  conversationId: string | null,
  onInsert: (message: ApiMessage) => void,
  onUpdate?: (message: ApiMessage) => void
) {
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
          onInsert(payload.new as ApiMessage)
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
          if (onUpdate) onUpdate(payload.new as ApiMessage)
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[realtime] conversation messages subscription failed:', status)
        }
      })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [conversationId, onInsert, onUpdate])
}
