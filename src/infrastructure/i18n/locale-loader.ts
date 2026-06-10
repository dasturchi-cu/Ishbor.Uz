export type Language = 'uz' | 'ru' | 'en'

type LocaleDictionary = Record<string, string>

let ruDictionary: LocaleDictionary | null = null
let enDictionary: LocaleDictionary | null = null
let ruLoad: Promise<LocaleDictionary> | null = null
let enLoad: Promise<LocaleDictionary> | null = null

export function isLocaleChunkLoaded(language: Language): boolean {
  if (language === 'uz') return true
  if (language === 'ru') return ruDictionary != null
  return enDictionary != null
}

export async function loadLocaleChunk(language: Language): Promise<LocaleDictionary | null> {
  if (language === 'uz') return null
  if (language === 'ru') {
    if (ruDictionary) return ruDictionary
    if (!ruLoad) {
      ruLoad = import('./locale-ru').then((mod) => {
        ruDictionary = mod.ruLocale
        return mod.ruLocale
      })
    }
    return ruLoad
  }
  if (enDictionary) return enDictionary
  if (!enLoad) {
    enLoad = import('./locale-en').then((mod) => {
      enDictionary = mod.enLocale
      return mod.enLocale
    })
  }
  return enLoad
}

export function getLoadedLocaleDictionary(language: Language): LocaleDictionary | null {
  if (language === 'ru') return ruDictionary
  if (language === 'en') return enDictionary
  return null
}
