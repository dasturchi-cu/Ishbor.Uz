/** Platform komissiyasi (basis points: 1000 = 10%) */
export const PLATFORM_COMMISSION_PERCENT = 10
export const PLATFORM_COMMISSION_BPS = 1000

export function calcPlatformFee(amountSom: number): number {
  if (amountSom <= 0) return 0
  return Math.floor((amountSom * PLATFORM_COMMISSION_BPS) / 10000)
}

export function calcFreelancerPayout(amountSom: number): number {
  return amountSom - calcPlatformFee(amountSom)
}
