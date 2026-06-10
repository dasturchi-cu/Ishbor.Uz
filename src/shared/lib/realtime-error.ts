import { logClientError } from '@/shared/lib/log-client-error'

export function logRealtimeSubscriptionError(
  channel: string,
  status: string,
  meta?: { table?: string; filter?: string }
): void {
  logClientError(new Error(`Realtime subscription ${status}`), {
    scope: 'realtime',
    apiPath: channel,
    page: meta?.table,
    queryKey: meta?.filter,
  })
}
