'use client'

import { useEffect, useRef } from 'react'
import { getSupabase, isSupabaseConfigured } from '@/infrastructure/supabase/client'

const IDLE_MS = (Number(process.env.NEXT_PUBLIC_SESSION_IDLE_MINUTES) || 120) * 60 * 1000
const EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const

export function useSessionIdleTimeout() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured()) return

    const reset = () => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        void getSupabase().auth.signOut()
        window.location.href = '/login?idle=1'
      }, IDLE_MS)
    }

    reset()
    for (const ev of EVENTS) {
      window.addEventListener(ev, reset, { passive: true })
    }
    return () => {
      if (timer.current) clearTimeout(timer.current)
      for (const ev of EVENTS) {
        window.removeEventListener(ev, reset)
      }
    }
  }, [])
}
