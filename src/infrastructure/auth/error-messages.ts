import type { TranslationKey } from '@/infrastructure/i18n'

export function mapAuthErrorMessage(
  message: string,
  t: (key: TranslationKey) => string
): string {
  const lower = message.toLowerCase()

  if (lower.includes('rate limit')) {
    return t('error_email_rate_limit')
  }
  if (lower.includes('already registered') || lower.includes('user already registered')) {
    return t('error_email_taken')
  }
  if (lower.includes('invalid login credentials')) {
    return t('error_invalid_credentials')
  }
  if (lower.includes('invalid totp') || (lower.includes('mfa') && lower.includes('invalid'))) {
    return t('mfa_invalid_code')
  }
  if (lower.includes('email not confirmed')) {
    return t('auth_email_confirm_sent')
  }
  if (lower.includes('token') || lower.includes('yaroqsiz') || lower.includes('sessiya')) {
    return t('error_invalid_token')
  }
  if (lower.includes('failed to fetch') || lower.includes('network')) {
    return 'Supabase serveriga ulanib bo\'lmadi. Internet va .env.local sozlamalarini tekshiring.'
  }

  return message
}
