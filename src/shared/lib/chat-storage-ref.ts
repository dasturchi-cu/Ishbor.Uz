export const CHAT_STORAGE_REF_PREFIX = 'ishbor-storage:'

export function buildChatStorageRef(bucket: string, path: string): string {
  return `${CHAT_STORAGE_REF_PREFIX}${bucket}:${path}`
}

export function parseChatStorageRef(content: string): { bucket: string; path: string } | null {
  const idx = content.indexOf(CHAT_STORAGE_REF_PREFIX)
  if (idx === -1) return null
  const raw = content.slice(idx + CHAT_STORAGE_REF_PREFIX.length).trim()
  const colon = raw.indexOf(':')
  if (colon <= 0) return null
  const bucket = raw.slice(0, colon)
  const path = raw.slice(colon + 1)
  if (!bucket || !path || path.includes('..')) return null
  return { bucket, path }
}

export function chatAttachmentLabelContent(label: string, ref: string): string {
  return `${label}: ${ref}`
}
