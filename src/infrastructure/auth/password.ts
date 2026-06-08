import { getSupabase } from '@/infrastructure/supabase/client'

export async function requestPasswordReset(email: string): Promise<void> {
  const supabase = getSupabase()
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/reset-password`,
  })
  if (error) throw error
}

export async function updatePassword(newPassword: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}
