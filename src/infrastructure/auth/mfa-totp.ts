import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabase } from '@/infrastructure/supabase/client'

export interface TotpFactorSummary {
  id: string
  friendlyName: string | null
  status: string
}

export interface TotpEnrollData {
  factorId: string
  qrCode: string
  secret: string
}

function client(): SupabaseClient {
  return getSupabase()
}

export async function listVerifiedTotpFactors(): Promise<TotpFactorSummary[]> {
  const { data, error } = await client().auth.mfa.listFactors()
  if (error) throw error
  return (data.totp ?? [])
    .filter((f) => f.status === 'verified')
    .map((f) => ({
      id: f.id,
      friendlyName: f.friendly_name ?? null,
      status: f.status,
    }))
}

export async function enrollTotp(friendlyName = 'Authenticator'): Promise<TotpEnrollData> {
  const { data, error } = await client().auth.mfa.enroll({
    factorType: 'totp',
    friendlyName,
  })
  if (error) throw error
  if (!data?.totp?.qr_code || !data.totp.secret) {
    throw new Error('mfa_enroll_failed')
  }
  return {
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
  }
}

export async function verifyTotpEnrollment(factorId: string, code: string): Promise<void> {
  const { error } = await client().auth.mfa.challengeAndVerify({
    factorId,
    code: code.trim(),
  })
  if (error) throw error
}

export async function verifyTotpLogin(code: string): Promise<void> {
  const { data, error: listError } = await client().auth.mfa.listFactors()
  if (listError) throw listError
  const factor =
    data.totp?.find((f) => f.status === 'verified') ?? data.totp?.[0]
  if (!factor) throw new Error('mfa_no_factor')

  const { error } = await client().auth.mfa.challengeAndVerify({
    factorId: factor.id,
    code: code.trim(),
  })
  if (error) throw error
}

export async function unenrollTotp(factorId: string): Promise<void> {
  const { error } = await client().auth.mfa.unenroll({ factorId })
  if (error) throw error
}

export async function needsMfaChallenge(): Promise<boolean> {
  const { data, error } = await client().auth.mfa.getAuthenticatorAssuranceLevel()
  if (error || !data) return false
  return data.nextLevel === 'aal2' && data.currentLevel !== 'aal2'
}
