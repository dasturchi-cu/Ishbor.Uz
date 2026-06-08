const REFERRAL_KEY = 'ishbor-referral-ref'

export function storeReferralRef(ref: string | null | undefined): void {
  if (typeof window === 'undefined' || !ref?.trim()) return
  sessionStorage.setItem(REFERRAL_KEY, ref.trim())
}

export function peekReferralRef(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(REFERRAL_KEY)
}

export function consumeReferralRef(): string | null {
  const ref = peekReferralRef()
  if (ref) sessionStorage.removeItem(REFERRAL_KEY)
  return ref
}
