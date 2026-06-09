'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { isRetryableQueryError } from '@/shared/lib/load-error'
import { isSupabaseRequestDebugEnabled, trackSupabaseRequest } from '@/shared/lib/supabase-request-debug'

const STALE_MS = 60_000
const GC_MS = 5 * 60_000
const MAX_QUERY_RETRIES = 3

function trackInvalidate(queryKey: unknown): void {
  trackSupabaseRequest({
    queryName: `react-query.invalidate:${JSON.stringify(queryKey)}`,
    endpoint: typeof window !== 'undefined' ? window.location.pathname : 'ssr',
    component: 'query-provider',
    kind: 'invalidate',
  })
}

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_MS,
        gcTime: GC_MS,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) =>
          isRetryableQueryError(error) && failureCount < MAX_QUERY_RETRIES,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      },
    },
  })
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => {
    const qc = createQueryClient()
    if (!isSupabaseRequestDebugEnabled()) return qc

    const originalInvalidate = qc.invalidateQueries.bind(qc)
    qc.invalidateQueries = ((filters, options) => {
      trackInvalidate(filters)
      return originalInvalidate(filters, options)
    }) as typeof qc.invalidateQueries

    return qc
  })

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

export { STALE_MS as QUERY_STALE_MS }
