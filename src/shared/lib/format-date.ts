import type { Language } from '@/infrastructure/i18n'

const LOCALE: Record<Language, string> = {
  uz: 'uz-UZ',
  ru: 'ru-RU',
  en: 'en-US',
}

export function formatDate(
  iso: string | Date,
  language: Language,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  const defaults: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }
  return d.toLocaleDateString(LOCALE[language], { ...defaults, ...options })
}

export function formatTime(iso: string | Date, language: Language): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return d.toLocaleTimeString(LOCALE[language], { hour: '2-digit', minute: '2-digit' })
}

export function formatDateShort(iso: string | Date, language: Language): string {
  return formatDate(iso, language, { day: 'numeric', month: 'short' })
}

const UZ_WEEKDAYS = [
  'Yakshanba',
  'Dushanba',
  'Seshanba',
  'Chorshanba',
  'Payshanba',
  'Juma',
  'Shanba',
] as const

const UZ_MONTHS = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentyabr',
  'oktyabr',
  'noyabr',
  'dekabr',
] as const

/** Dashboard sarlavhasi — uz-UZ Intl noto'g'ri format beradi */
export function formatDashboardHeaderDate(date: Date, language: Language): string {
  if (language === 'uz') {
    return `${UZ_WEEKDAYS[date.getDay()]}, ${date.getDate()}-${UZ_MONTHS[date.getMonth()]} ${date.getFullYear()}`
  }
  const locale = LOCALE[language]
  const formatted = date.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}
