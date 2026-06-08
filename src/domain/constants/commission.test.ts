import { describe, expect, it } from 'vitest'

import {
  PLATFORM_COMMISSION_BPS,
  PLATFORM_COMMISSION_PERCENT,
  calcFreelancerPayout,
  calcPlatformFee,
} from './commission'

describe('commission', () => {
  it('exposes 10% platform rate', () => {
    expect(PLATFORM_COMMISSION_PERCENT).toBe(10)
    expect(PLATFORM_COMMISSION_BPS).toBe(1000)
  })

  it('calculates platform fee in som', () => {
    expect(calcPlatformFee(1_000_000)).toBe(100_000)
    expect(calcPlatformFee(0)).toBe(0)
    expect(calcPlatformFee(-5)).toBe(0)
  })

  it('calculates freelancer net payout', () => {
    expect(calcFreelancerPayout(1_000_000)).toBe(900_000)
    expect(calcPlatformFee(1_000_000) + calcFreelancerPayout(1_000_000)).toBe(1_000_000)
  })
})
