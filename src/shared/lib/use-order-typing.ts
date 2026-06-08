'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { getSupabase, isSupabaseConfigured } from '@/infrastructure/supabase/client'

type TypingPayload = { user_id: string; typing: boolean }

export function useOrderTyping(
  orderId: string | null,
  userId: string | null | undefined,
  onPeerTyping: (typing: boolean) => void
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!orderId || !userId || !isSupabaseConfigured()) return

    const supabase = getSupabase()
    const channel = supabase
      .channel(`typing-${orderId}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const data = payload as TypingPayload
        if (!data?.user_id || data.user_id === userId) return
        onPeerTyping(Boolean(data.typing))
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        if (data.typing) {
          timeoutRef.current = setTimeout(() => onPeerTyping(false), 3500)
        }
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      channelRef.current = null
      void supabase.removeChannel(channel)
    }
  }, [orderId, userId, onPeerTyping])

  const sendTyping = useCallback(
    (typing: boolean) => {
      if (!orderId || !userId || !channelRef.current) return
      void channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: userId, typing },
      })
    },
    [orderId, userId]
  )

  return sendTyping
}
