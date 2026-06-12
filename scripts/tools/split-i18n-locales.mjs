import fs from 'fs'
import path from 'path'

const root = process.cwd()
const indexPath = path.join(root, 'src/infrastructure/i18n/index.ts')
const src = fs.readFileSync(indexPath, 'utf8')

const uzStart = src.indexOf('  uz: {')
const ruStart = src.indexOf('  ru: {')
const enStart = src.indexOf('  en: {')
const end = src.indexOf('} as const satisfies')
if (uzStart < 0 || ruStart < 0 || enStart < 0 || end < 0) {
  console.error('Could not find locale blocks', { uzStart, ruStart, enStart, end })
  process.exit(1)
}

const stripLocaleInner = (text) =>
  text
    .trim()
    .replace(/,\s*$/, '')
    .replace(/\}\s*$/, '')
    .trim()

const ruInner = stripLocaleInner(src.slice(ruStart + '  ru: {'.length, enStart))
const enInner = stripLocaleInner(src.slice(enStart + '  en: {'.length, end))
const uzBlock = src.slice(uzStart, ruStart).trim().replace(/,\s*$/, '')

const ruImports = `import { dashboardI18nRu } from './dashboard-i18n'
import { settingsI18nRu } from './settings-i18n'
import { profileI18nRu } from './profile-i18n'
import { helpI18nRu } from './help-i18n'
import { landingI18nRu } from './landing-i18n'
import { adminI18nRu } from './admin-i18n'
import { trustI18nRu } from './trust-i18n'
`

const enImports = `import { dashboardI18nEn } from './dashboard-i18n'
import { settingsI18nEn } from './settings-i18n'
import { profileI18nEn } from './profile-i18n'
import { helpI18nEn } from './help-i18n'
import { landingI18nEn } from './landing-i18n'
import { adminI18nEn } from './admin-i18n'
import { trustI18nEn } from './trust-i18n'
`

fs.writeFileSync(
  path.join(root, 'src/infrastructure/i18n/locale-ru.ts'),
  `${ruImports}\nexport const ruLocale = {\n${ruInner}\n} as const\n`
)
fs.writeFileSync(
  path.join(root, 'src/infrastructure/i18n/locale-en.ts'),
  `${enImports}\nexport const enLocale = {\n${enInner}\n} as const\n`
)

const headerImports = `import { dashboardI18nUz } from './dashboard-i18n'
import { settingsI18nUz } from './settings-i18n'
import { profileI18nUz } from './profile-i18n'
import { helpI18nUz } from './help-i18n'
import { landingI18nUz } from './landing-i18n'
import { adminI18nUz } from './admin-i18n'
import { trustI18nUz } from './trust-i18n'
import { getLoadedLocaleDictionary, loadLocaleChunk } from './locale-loader'

export type Language = 'uz' | 'ru' | 'en'

`

const newIndex = `${headerImports}export const translations = {
  ${uzBlock},
} as const satisfies Record<'uz', Record<string, string>>

export type TranslationKey = keyof typeof translations.uz

export function t(language: Language, key: TranslationKey): string {
  if (language === 'uz') return translations.uz[key] ?? key
  const loaded = getLoadedLocaleDictionary(language)
  if (loaded) return loaded[key] ?? translations.uz[key] ?? key
  void loadLocaleChunk(language)
  return translations.uz[key] ?? key
}
`

fs.writeFileSync(indexPath, newIndex)
console.log('Split i18n locales complete')
