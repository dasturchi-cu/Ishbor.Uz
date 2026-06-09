'use client'

import { useEffect } from 'react'
import {
  attachSupabaseDebugGlobals,
  dumpSupabaseRequestTop10,
  exportSupabaseRequestBatch,
  isSupabaseRequestDebugEnabled,
  trackSupabaseRequest,
} from '@/shared/lib/supabase-request-debug'

const REPORT_INTERVAL_MS = 60_000

export function SupabaseRequestAuditReporter() {
  useEffect(() => {
    if (!isSupabaseRequestDebugEnabled()) return

    attachSupabaseDebugGlobals()

    const onFocus = () => {
      trackSupabaseRequest({
        queryName: 'browser.focus',
        endpoint: window.location.pathname,
        component: 'SupabaseRequestAuditReporter',
        kind: 'focus',
      })
    }

    const onVisibility = () => {
      trackSupabaseRequest({
        queryName: `browser.visibility:${document.visibilityState}`,
        endpoint: window.location.pathname,
        component: 'SupabaseRequestAuditReporter',
        kind: 'visibility',
      })
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)

    const interval = window.setInterval(() => {
      dumpSupabaseRequestTop10()
      void fetch('/api/v1/platform/request-audit/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: exportSupabaseRequestBatch().map((row) => ({
            query_name: row.queryName,
            endpoint: row.endpoint,
            component: row.component,
            kind: row.kind,
            count_total: row.countTotal,
            count_last_hour: row.countLastHour,
          })),
        }),
        keepalive: true,
      }).catch(() => undefined)
    }, REPORT_INTERVAL_MS)

    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
      window.clearInterval(interval)
    }
  }, [])

  return null
}
