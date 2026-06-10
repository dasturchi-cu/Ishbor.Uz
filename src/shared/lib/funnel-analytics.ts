import { api } from '@/infrastructure/api/client'

const SESSION_KEY = 'ishbor-funnel-session'

export type FunnelEvent =
  | 'funnel_landing_cta_click'
  | 'funnel_register_view'
  | 'funnel_register_role_select'
  | 'funnel_register_step2'
  | 'funnel_browse_catalog'

export type ActivationEvent = 'employer_first_action' | 'candidate_first_listing' | 'onboarding_complete'

export function getFunnelSessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = sessionStorage.getItem(SESSION_KEY)
  if (!id) {
    id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    sessionStorage.setItem(SESSION_KEY, id)
  }
  return id
}

/** Pre-auth funnel steps — anonymous, session-scoped. */
export function trackFunnelEvent(
  event: FunnelEvent,
  properties?: Record<string, unknown>,
): void {
  const sessionId = getFunnelSessionId()
  if (!sessionId) return
  void api.trackFunnel(event, properties, sessionId)
}

/** Post-auth activation — deduped server-side per user. */
export function trackActivationEvent(
  event: ActivationEvent,
  properties?: Record<string, unknown>,
): void {
  void api.trackAnalytics(event, properties)
}
