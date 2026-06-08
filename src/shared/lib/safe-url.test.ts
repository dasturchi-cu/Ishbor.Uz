import { describe, expect, it } from 'vitest'

import { isAllowedExternalUrl, isAllowedPaymentRedirectUrl } from './safe-url'

describe('safe-url', () => {
  it('allows trusted payment redirect hosts', () => {
    expect(isAllowedPaymentRedirectUrl('https://my.click.uz/services/pay?x=1')).toBe(true)
    expect(isAllowedPaymentRedirectUrl('https://checkout.paycom.uz/abc')).toBe(true)
    expect(isAllowedPaymentRedirectUrl('http://my.click.uz/pay')).toBe(false)
    expect(isAllowedPaymentRedirectUrl('https://evil.com/pay')).toBe(false)
  })

  it('allows external urls for storage and product domains', () => {
    expect(
      isAllowedExternalUrl('https://abc.supabase.co/storage/v1/object/public/avatars/a.png')
    ).toBe(true)
    expect(isAllowedExternalUrl('https://ishbor.uz/about')).toBe(true)
    expect(isAllowedExternalUrl('http://localhost:3000/dashboard')).toBe(true)
    expect(isAllowedExternalUrl('javascript:alert(1)')).toBe(false)
  })
})
