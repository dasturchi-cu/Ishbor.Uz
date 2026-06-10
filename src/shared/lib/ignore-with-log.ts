import { logClientError, type ClientErrorContext } from '@/shared/lib/log-client-error'

/** Non-critical failures: log for diagnostics, do not block UI */
export function ignoreWithLog(error: unknown, context: ClientErrorContext): void {
  logClientError(error, context)
}

/** Optional data slice: fallback on failure, flag for partial UI */
export async function loadOptional<T>(
  fn: () => Promise<T>,
  fallback: T,
  context: ClientErrorContext
): Promise<{ value: T; failed: boolean }> {
  try {
    return { value: await fn(), failed: false }
  } catch (error) {
    ignoreWithLog(error, context)
    return { value: fallback, failed: true }
  }
}
