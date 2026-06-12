'use client'

import { useEffect, useState } from 'react'
import { getSupabase, isSupabaseConfigured } from '@/infrastructure/supabase/client'
import { api } from '@/infrastructure/api/client'
import { ignoreWithLog } from '@/shared/lib/ignore-with-log'

type GateState = {
  loading: boolean
  blocked: boolean
}

let configCache: { require_email_verified: boolean } | null = null

export function useEmailVerificationGate(): GateState {
  const [state, setState] = useState<GateState>({ loading: true, blocked: false })

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        if (!configCache) {
          configCache = await api.getSecurityConfig()
        }
        if (!configCache.require_email_verified) {
          if (!cancelled) setState({ loading: false, blocked: false })
          return
        }
        if (!isSupabaseConfigured()) {
          if (!cancelled) setState({ loading: false, blocked: false })
          return
        }
        const { data } = await getSupabase().auth.getUser()
        const verified = Boolean(data.user?.email_confirmed_at)
        if (!cancelled) setState({ loading: false, blocked: !verified })
      } catch (e) {
        ignoreWithLog(e, { scope: 'auth', apiPath: '/api/v1/security/config' })
        if (!cancelled) setState({ loading: false, blocked: false })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
