import { api } from '@/infrastructure/api/client'

export type TermsDocType = 'terms' | 'privacy' | 'buyer_protection'

export interface TermsConsentStatus {
  accepted: Record<string, string>
  pending: string[]
  requires_consent: boolean
}

export async function fetchTermsConsentStatus(_userId: string): Promise<TermsConsentStatus> {
  return api.getTermsConsentStatus()
}

export async function acceptTermsConsentRemote(
  _userId: string,
  docType: TermsDocType,
  version: string,
): Promise<void> {
  await api.acceptTermsConsent(docType, version)
}

export async function fetchCurrentTerms(docType: TermsDocType) {
  return api.getCurrentTerms(docType)
}
