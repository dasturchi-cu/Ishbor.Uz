import { getSupabase } from '@/infrastructure/supabase/client'

export interface SessionSummary {
  expiresAt: number | null
  lastSignInAt: string | null
  email: string | null
}

export async function requestEmailChange(newEmail: string): Promise<void> {
  const { error } = await getSupabase().auth.updateUser({ email: newEmail.trim() })
  if (error) throw error
}

export async function getCurrentSessionSummary(): Promise<SessionSummary | null> {
  const { data, error } = await getSupabase().auth.getSession()
  if (error || !data.session) return null
  const session = data.session
  return {
    expiresAt: session.expires_at ?? null,
    lastSignInAt: session.user.last_sign_in_at ?? null,
    email: session.user.email ?? null,
  }
}

/** Boshqa qurilmalardagi seanslarni tugatish; joriy seans saqlanadi */
export async function signOutOtherSessions(): Promise<void> {
  const { error } = await getSupabase().auth.signOut({ scope: 'others' })
  if (error) throw error
}
