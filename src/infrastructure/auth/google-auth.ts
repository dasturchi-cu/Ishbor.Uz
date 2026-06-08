/** Supabase Dashboard → Auth → Providers → Google yoqilgach true qiling */
export function isGoogleAuthEnabled(): boolean {
  return process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true'
}
