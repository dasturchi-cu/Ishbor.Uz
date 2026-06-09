import { ApiError } from '@/infrastructure/api/client'
import type { LoadErrorContext } from '@/shared/lib/load-error'

export type ClientErrorContext = Omit<LoadErrorContext, 'scope'> & { scope: string }

interface ClientErrorPayload {
  scope: string
  message: string
  status: number
  api_path?: string
  query_key?: string
  page?: string
  url?: string
  ts: string
}

function buildPayload(error: unknown, context: ClientErrorContext): ClientErrorPayload {
  const status = error instanceof ApiError ? error.status : 0
  const message =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : String(error)

  return {
    scope: context.scope,
    message: message.slice(0, 500),
    status,
    api_path: context.apiPath ?? (error instanceof ApiError ? error.path : undefined),
    query_key: context.queryKey,
    page: context.page ?? (typeof window !== 'undefined' ? window.location.pathname : undefined),
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    ts: new Date().toISOString(),
  }
}

const loggedKeys = new Set<string>()

export function logClientError(error: unknown, context: ClientErrorContext): void {
  const payload = buildPayload(error, context)
  const dedupeKey = `${payload.scope}:${payload.status}:${payload.api_path}:${payload.message.slice(0, 80)}`
  if (loggedKeys.has(dedupeKey)) return
  loggedKeys.add(dedupeKey)

  console.error('[IshBor client error]', payload)

  if (typeof window === 'undefined') return

  void fetch('/api/v1/platform/client-errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => undefined)
}
