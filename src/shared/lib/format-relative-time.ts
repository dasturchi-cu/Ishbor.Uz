import type { Language } from '@/infrastructure/i18n'

const LOCALE: Record<Language, string> = {
  uz: 'uz-UZ',
  ru: 'ru-RU',
  en: 'en-US',
}

export function formatRelativeTime(iso: string | null | undefined, language: Language): string {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffM = Math.floor(diffMs / 60_000)
  const diffH = Math.floor(diffMs / 3_600_000)

  if (diffM < 1) {
    return language === 'ru' ? '< 1 мин' : language === 'en' ? '< 1m' : '< 1 daq'
  }
  if (diffH < 1) {
    return language === 'ru' ? `${diffM} мин` : language === 'en' ? `${diffM}m` : `${diffM} daq`
  }
  if (diffH < 24) {
    return language === 'ru' ? `${diffH} ч` : language === 'en' ? `${diffH}h` : `${diffH} soat`
  }
  return d.toLocaleDateString(LOCALE[language], { day: 'numeric', month: 'short' })
}
