type RequestMeta = {
  method?: string
  path?: string
  queryKey?: string
  component?: string
}

const counts = new Map<string, number>()

export function isRequestDebugEnabled(): boolean {
  return process.env.NEXT_PUBLIC_REQUEST_DEBUG === '1'
}

export function trackRequest(name: string, meta?: RequestMeta): void {
  if (!isRequestDebugEnabled()) return
  const total = (counts.get(name) ?? 0) + 1
  counts.set(name, total)
  console.info('[IshBor request]', {
    name,
    count: total,
    ...meta,
  })
}

export function getRequestDebugCounts(): ReadonlyMap<string, number> {
  return counts
}

export function resetRequestDebugCounts(): void {
  counts.clear()
}

export function wrapQueryFn<T>(name: string, fn: () => Promise<T>, meta?: RequestMeta): () => Promise<T> {
  return async () => {
    trackRequest(name, meta)
    return fn()
  }
}
