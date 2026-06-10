import { api } from '@/infrastructure/api/client'
import type { ApiPublicStats } from '@/infrastructure/api/types'

const CACHE_KEY = 'ishbor-public-stats-v1'
const SESSION_TTL_MS = 5 * 60 * 1000
const PERSIST_TTL_MS = 30 * 60 * 1000

type CacheEntry = { at: number; data: ApiPublicStats }

function readStorage(storage: Storage, ttlMs: number): ApiPublicStats | null {
  try {
    const raw = storage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheEntry
    if (Date.now() - parsed.at > ttlMs) return null
    return parsed.data
  } catch {
    return null
  }
}

function readCache(): ApiPublicStats | null {
  if (typeof window === 'undefined') return null
  return (
    readStorage(sessionStorage, SESSION_TTL_MS) ??
    readStorage(localStorage, PERSIST_TTL_MS)
  )
}

/** Sync read for landing paint — avoids skeleton flash on repeat visits */
export function readPublicStatsCacheSync(): ApiPublicStats | null {
  return readCache()
}

function writeCache(data: ApiPublicStats): void {
  if (typeof window === 'undefined') return
  const entry: CacheEntry = { at: Date.now(), data }
  const payload = JSON.stringify(entry)
  try {
    sessionStorage.setItem(CACHE_KEY, payload)
  } catch {
    /* quota or private mode */
  }
  try {
    localStorage.setItem(CACHE_KEY, payload)
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
