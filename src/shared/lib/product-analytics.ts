import { api } from '@/infrastructure/api/client'
import { trackFunnelEvent } from '@/shared/lib/funnel-analytics'

/** Checkout modal opened — guest (funnel) or authenticated (product). */
export function trackCheckoutStarted(
  properties: {
    surface: string
    service_id?: string
    project_id?: string
    is_guest?: boolean
  },
): void {
  if (properties.is_guest) {
    trackFunnelEvent('funnel_checkout_started', properties)
    return
  }
  void api.trackAnalytics('checkout_started', properties)
}
