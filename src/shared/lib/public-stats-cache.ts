import { api } from '@/infrastructure/api/client'
import type { ApiPublicStats } from '@/infrastructure/api/types'

const CACHE_KEY = 'ishbor-public-stats-v1'
const TTL_MS = 5 * 60 * 1000

type CacheEntry = { at: number; data: ApiPublicStats }

function readCache(): ApiPublicStats | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheEntry
    if (Date.now() - parsed.at > TTL_MS) return null
    return parsed.data
  } catch {
    return null
  }
}

function writeCache(data: ApiPublicStats): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    const entry: CacheEntry = { at: Date.now(), data }
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry))
  } catch {
    /* quota or private mode */
  }
}

export async function fetchPublicStatsCached(): Promise<ApiPublicStats> {
  const cached = readCache()
  if (cached) return cached
  const data = await api.publicStats()
  writeCache(data)
  return data
}
