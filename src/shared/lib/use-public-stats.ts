'use client'

import { useEffect, useState } from 'react'
import type { ApiPublicStats } from '@/infrastructure/api/types'
import { fetchPublicStatsCached, readPublicStatsCacheSync } from '@/shared/lib/public-stats-cache'

/** Cached platform stats for trust metrics and social proof */
export function usePublicStats(): ApiPublicStats | null {
  const [stats, setStats] = useState<ApiPublicStats | null>(() => readPublicStatsCacheSync())

  useEffect(() => {
    let cancelled = false
    void fetchPublicStatsCached()
      .then((data) => {
        if (!cancelled) setStats(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return stats
}
