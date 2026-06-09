export interface ServiceFaqItem {
  q: string
  a: string
}

const MAX_FAQ = 5
const MIN_LEN = 3
const MAX_Q_LEN = 200
const MAX_A_LEN = 500

/** Q: savol / A: javob — juftliklar bo'sh qator bilan ajratiladi */
export function parseServiceFaqText(text: string): ServiceFaqItem[] {
  const blocks = text.split(/\n\s*\n/)
  const items: ServiceFaqItem[] = []
  const seen = new Set<string>()

  for (const block of blocks) {
    let q = ''
    let a = ''
    for (const line of block.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed) continue
      const qMatch = trimmed.match(/^Q:\s*(.+)$/i)
      const aMatch = trimmed.match(/^A:\s*(.+)$/i)
      if (qMatch) q = qMatch[1].trim()
      else if (aMatch) a = aMatch[1].trim()
    }
    if (q.length < MIN_LEN || a.length < MIN_LEN) continue
    if (q.length > MAX_Q_LEN || a.length > MAX_A_LEN) continue
    const key = q.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    items.push({ q, a })
    if (items.length >= MAX_FAQ) break
  }
  return items
}

export function formatServiceFaqText(items: ServiceFaqItem[] | undefined | null): string {
  return (items ?? [])
    .map((item) => `Q: ${item.q}\nA: ${item.a}`)
    .join('\n\n')
}
