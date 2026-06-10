import { ApiError, getApiBaseUrl } from '@/infrastructure/api/client'
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
const MAX_LOGGED_KEYS = 200

/** Next rewrite orqali emas — to'g'ridan FastAPI (node proxy tsiklini oldini oladi) */
const REMOTE_SKIP_STATUSES = new Set([0, 408, 499, 503])

export function logClientError(error: unknown, context: ClientErrorContext): void {
  const payload = buildPayload(error, context)
  const dedupeKey = `${payload.scope}:${payload.status}:${payload.api_path}:${payload.message.slice(0, 80)}`
  if (loggedKeys.has(dedupeKey)) return
  loggedKeys.add(dedupeKey)
  if (loggedKeys.size > MAX_LOGGED_KEYS) {
    const first = loggedKeys.values().next().value
    if (first) loggedKeys.delete(first)
  }

  if (process.env.NODE_ENV === 'development') {
    console.warn('[IshBor client error]', payload)
  } else {
    console.error('[IshBor client error]', payload)
  }

  if (typeof window === 'undefined') return
  if (REMOTE_SKIP_STATUSES.has(payload.status)) return

  const base = getApiBaseUrl()
  if (!base) return

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 5000)
  void fetch(`${base}/api/v1/platform/client-errors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
    signal: controller.signal,
  })
    .catch(() => undefined)
    .finally(() => window.clearTimeout(timeout))
}
