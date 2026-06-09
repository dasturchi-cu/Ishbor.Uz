type MiddlewareTrackMeta = {
  queryName: string
  pathname: string
  component: string
}

export function isMiddlewareRequestDebugEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SUPABASE_REQUEST_DEBUG === '1'
}

export function trackMiddlewareSupabaseRequest(meta: MiddlewareTrackMeta): void {
  if (!isMiddlewareRequestDebugEnabled()) return
  console.info('[IshBor supabase]', {
    queryName: meta.queryName,
    endpoint: meta.pathname,
    component: meta.component,
    kind: 'middleware',
  })
}
