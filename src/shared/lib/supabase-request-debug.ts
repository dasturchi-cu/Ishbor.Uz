export type SupabaseRequestKind =
  | 'db'
  | 'auth'
  | 'realtime_subscribe'
  | 'realtime_event'
  | 'invalidate'
  | 'middleware'
  | 'focus'
  | 'visibility'

export type SupabaseRequestMeta = {
  queryName: string
  endpoint?: string
  component?: string
  kind?: SupabaseRequestKind
  table?: string
  operation?: string
}

type Entry = {
  queryName: string
  endpoint: string
  component: string
  kind: SupabaseRequestKind
  countTotal: number
  timestamps: number[]
}

const HOUR_MS = 60 * 60 * 1000
const MAX_TIMESTAMPS = 5000
const entries = new Map<string, Entry>()

export function isSupabaseRequestDebugEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SUPABASE_REQUEST_DEBUG === '1'
}

function entryKey(meta: SupabaseRequestMeta): string {
  const kind = meta.kind ?? 'db'
  const endpoint = meta.endpoint ?? 'client'
  const component = meta.component ?? inferCallerComponent()
  return `${kind}|${meta.queryName}|${endpoint}|${component}`
}

export function inferCallerComponent(): string {
  if (typeof Error === 'undefined' || !Error.captureStackTrace) {
    return 'unknown'
  }
  try {
    const stack = new Error().stack ?? ''
    const lines = stack.split('\n').slice(2)
    for (const line of lines) {
      if (line.includes('supabase-request-debug') || line.includes('instrumented-browser-client')) {
        continue
      }
      const match =
        line.match(/(?:at |@)(?:.*\/)?((?:src|app)\/[^:?)]+)/) ??
        line.match(/(?:at |@)([^/()]+?\.(?:tsx|ts))/)
      if (match?.[1]) {
        return match[1].replace(/\\/g, '/')
      }
    }
  } catch {
    /* ignore */
  }
  return 'unknown'
}

export function trackSupabaseRequest(meta: SupabaseRequestMeta): void {
  if (!isSupabaseRequestDebugEnabled()) return

  const now = Date.now()
  const key = entryKey(meta)
  const kind = meta.kind ?? 'db'
  const endpoint = meta.endpoint ?? 'client'
  const component = meta.component ?? inferCallerComponent()

  let entry = entries.get(key)
  if (!entry) {
    entry = {
      queryName: meta.queryName,
      endpoint,
      component,
      kind,
      countTotal: 0,
      timestamps: [],
    }
    entries.set(key, entry)
  }

  entry.countTotal += 1
  entry.timestamps.push(now)
  if (entry.timestamps.length > MAX_TIMESTAMPS) {
    const cutoff = now - HOUR_MS
    entry.timestamps = entry.timestamps.filter((t) => t >= cutoff)
  }

  console.info('[IshBor supabase]', {
    queryName: meta.queryName,
    endpoint,
    component,
    kind,
    countTotal: entry.countTotal,
    lastHour: countLastHour(entry.timestamps),
    table: meta.table,
    operation: meta.operation,
  })
}

function countLastHour(timestamps: number[]): number {
  const cutoff = Date.now() - HOUR_MS
  return timestamps.filter((t) => t >= cutoff).length
}

export type SupabaseRequestStat = {
  queryName: string
  endpoint: string
  component: string
  kind: SupabaseRequestKind
  countTotal: number
  countLastHour: number
}

export function getSupabaseRequestStats(): SupabaseRequestStat[] {
  const cutoff = Date.now() - HOUR_MS
  return [...entries.values()]
    .map((entry) => ({
      queryName: entry.queryName,
      endpoint: entry.endpoint,
      component: entry.component,
      kind: entry.kind,
      countTotal: entry.countTotal,
      countLastHour: entry.timestamps.filter((t) => t >= cutoff).length,
    }))
    .sort((a, b) => b.countLastHour - a.countLastHour || b.countTotal - a.countTotal)
}

export function getSupabaseRequestTop10(): SupabaseRequestStat[] {
  return getSupabaseRequestStats().slice(0, 10)
}

export function resetSupabaseRequestStats(): void {
  entries.clear()
}

export function dumpSupabaseRequestTop10(): void {
  const top = getSupabaseRequestTop10()
  console.table(
    top.map((row) => ({
      query: row.queryName,
      endpoint: row.endpoint,
      component: row.component,
      kind: row.kind,
      total: row.countTotal,
      lastHour: row.countLastHour,
    })),
  )
}

export function exportSupabaseRequestBatch(): SupabaseRequestStat[] {
  return getSupabaseRequestStats()
}

declare global {
  interface Window {
    __ISHBOR_SUPABASE_DEBUG__?: {
      top10: () => SupabaseRequestStat[]
      dump: () => void
      reset: () => void
      all: () => SupabaseRequestStat[]
    }
  }
}

export function attachSupabaseDebugGlobals(): void {
  if (typeof window === 'undefined' || !isSupabaseRequestDebugEnabled()) return
  window.__ISHBOR_SUPABASE_DEBUG__ = {
    top10: getSupabaseRequestTop10,
    dump: dumpSupabaseRequestTop10,
    reset: resetSupabaseRequestStats,
    all: getSupabaseRequestStats,
  }
}
