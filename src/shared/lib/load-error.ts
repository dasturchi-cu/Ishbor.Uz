import { ApiError } from '@/infrastructure/api/client'
import type { TranslationKey } from '@/infrastructure/i18n'
import { logClientError } from '@/shared/lib/log-client-error'

export type LoadErrorScope =
  | 'dashboard'
  | 'orders'
  | 'notifications'
  | 'profile'
  | 'wallet'
  | 'messages'
  | 'services'
  | 'projects'
  | 'applications'
  | 'reviews'
  | 'payments'
  | 'analytics'
  | 'saved'
  | 'admin'
  | 'catalog'
  | 'generic'

const SCOPE_KEYS: Record<LoadErrorScope, TranslationKey> = {
  dashboard: 'error_load_dashboard',
  orders: 'error_load_orders',
  notifications: 'error_load_notifications',
  profile: 'error_load_profile',
  wallet: 'error_load_wallet',
  messages: 'error_load_messages',
  services: 'error_load_services',
  projects: 'error_load_projects',
  applications: 'error_load_applications',
  reviews: 'error_load_reviews',
  payments: 'error_load_payments',
  analytics: 'error_load_analytics',
  saved: 'error_load_saved',
  admin: 'error_load_admin',
  catalog: 'error_load_catalog',
  generic: 'error_load_generic',
}

export interface LoadErrorContext {
  scope: LoadErrorScope
  apiPath?: string
  queryKey?: string
  page?: string
}

export function resolveLoadError(
  error: unknown,
  t: (key: TranslationKey) => string,
  scope: LoadErrorScope = 'generic'
): string {
  const scoped = t(SCOPE_KEYS[scope])

  if (error instanceof ApiError) {
    if (error.status === 401) return t('error_auth_expired')
    if (error.status === 403) return t('error_forbidden')
    if (error.status === 404) {
      if (scope === 'profile') return t('profile_not_found_desc')
      if (scope === 'services') return t('service_not_found_desc')
      if (scope === 'orders') return t('order_not_found_desc')
      return scoped
    }
    if (error.status === 408 || error.status === 0) return t('error_network')
    if (error.status >= 500) return t('error_server')
    if (error.message && !error.message.startsWith('[')) return error.message
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return t('error_network')
  }

  if (error instanceof TypeError) {
    return t('error_network')
  }

  if (error instanceof Error && error.message) {
    const lower = error.message.toLowerCase()
    if (lower.includes('fetch') || lower.includes('network')) return t('error_network')
    if (lower.includes('401') || lower.includes('jwt')) return t('error_auth_expired')
    return error.message
  }

  return scoped
}

export function captureLoadError(
  error: unknown,
  context: LoadErrorContext,
  t: (key: TranslationKey) => string
): string {
  logClientError(error, context)
  return resolveLoadError(error, t, context.scope)
}

export function isRetryableQueryError(error: unknown): boolean {
  if (error instanceof ApiError) {
    if ([401, 403, 404, 422].includes(error.status)) {
      return false
    }
    return [0, 408, 429, 500, 502, 503, 504].includes(error.status)
  }
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true
  }
  if (error instanceof TypeError) {
    return true
  }
  return false
}
