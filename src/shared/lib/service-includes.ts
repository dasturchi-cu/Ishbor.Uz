const MAX_INCLUDES = 10
const MIN_ITEM_LEN = 3
const MAX_ITEM_LEN = 200

export function parseServiceIncludesText(text: string): string[] {
  const seen = new Set<string>()
  const items: string[] = []
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.length < MIN_ITEM_LEN || trimmed.length > MAX_ITEM_LEN) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    items.push(trimmed)
    if (items.length >= MAX_INCLUDES) break
  }
  return items
}

export function formatServiceIncludesText(items: string[] | undefined | null): string {
  return (items ?? []).join('\n')
}

export function isValidServiceIncludes(items: string[]): boolean {
  return items.length >= 1 && items.length <= MAX_INCLUDES
}
