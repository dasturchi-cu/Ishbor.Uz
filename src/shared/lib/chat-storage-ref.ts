export const CHAT_STORAGE_REF_PREFIX = 'ishbor-storage:'

export function buildChatStorageRef(bucket: string, path: string): string {
  return `${CHAT_STORAGE_REF_PREFIX}${bucket}:${path}`
}

/** Alias — private bucket uploads (project attachments, chat, etc.) */
export const buildStorageRef = buildChatStorageRef

export function parseLegacyPublicStorageUrl(
  url: string,
): { bucket: string; path: string } | null {
  const marker = '/storage/v1/object/public/'
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  const rest = url.slice(idx + marker.length)
  const slash = rest.indexOf('/')
  if (slash <= 0) return null
  const bucket = rest.slice(0, slash)
  const path = rest.slice(slash + 1)
  if (!bucket || !path || path.includes('..')) return null
  return { bucket, path }
}

export function parseStoredStorageLocation(
  value: string,
): { bucket: string; path: string } | null {
  return parseChatStorageRef(value) ?? parseLegacyPublicStorageUrl(value)
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

const PRIVATE_STORAGE_BUCKETS = new Set(['project-attachments'])

/** Private bucket refs/legacy URLs need signed URL resolution; public buckets use direct URL. */
export function resolvePrivateStorageLocation(
  value: string,
): { bucket: string; path: string } | null {
  const location = parseStoredStorageLocation(value)
  if (!location || !PRIVATE_STORAGE_BUCKETS.has(location.bucket)) return null
  return location
}

export function chatAttachmentLabelContent(label: string, ref: string): string {
  return `${label}: ${ref}`
}
