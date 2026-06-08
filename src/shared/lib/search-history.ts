const KEY = 'ishbor-search-history'
const MAX = 6

export function getSearchHistory(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : []
  } catch {
    return []
  }
}

export function pushSearchHistory(query: string) {
  const q = query.trim()
  if (!q || typeof window === 'undefined') return
  const prev = getSearchHistory().filter((s) => s.toLowerCase() !== q.toLowerCase())
  localStorage.setItem(KEY, JSON.stringify([q, ...prev].slice(0, MAX)))
}
