/** Map common uz/ru/en search terms to marketplace category slugs */
const QUERY_CATEGORY_MAP: Record<string, string[]> = {
  logo: ['graphic'],
  dizayn: ['graphic', 'uiux'],
  design: ['graphic', 'uiux'],
  grafik: ['graphic'],
  ui: ['uiux'],
  ux: ['uiux'],
  uiux: ['uiux'],
  python: ['web', 'mobile'],
  django: ['web'],
  telegram: ['web', 'mobile'],
  bot: ['web', 'mobile'],
  web: ['web'],
  sayt: ['web'],
  veb: ['web'],
  website: ['web'],
  seo: ['seo'],
  smm: ['smm'],
  video: ['video'],
  montaj: ['video'],
  matn: ['writing'],
  content: ['writing'],
  mobile: ['mobile'],
  android: ['mobile'],
  ios: ['mobile'],
}

export function categoryHintsForQuery(query: string): string[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const tokens = q.split(/[\s,;.+/\\-]+/).filter((t) => t.length >= 2)
  const hints = new Set<string>()
  for (const token of tokens) {
    for (const cat of QUERY_CATEGORY_MAP[token] ?? []) {
      hints.add(cat)
    }
  }
  const joined = tokens.join(' ')
  for (const [key, cats] of Object.entries(QUERY_CATEGORY_MAP)) {
    if (joined.includes(key)) {
      cats.forEach((c) => hints.add(c))
    }
  }
  return [...hints]
}
