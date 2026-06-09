import type { ApiMessage } from '@/infrastructure/api/types'

export function isTempChatMessageId(id: string): boolean {
  return id.startsWith('temp-')
}

/** Optimistic temp xabarni server/realtime xabari bilan almashtirish */
export function mergeIncomingChatMessage(prev: ApiMessage[], incoming: ApiMessage): ApiMessage[] {
  if (prev.some((m) => m.id === incoming.id)) return prev

  const withoutMatchingTemp = prev.filter(
    (m) =>
      !(
        isTempChatMessageId(m.id) &&
        m.sender_id === incoming.sender_id &&
        m.content.trim() === incoming.content.trim()
      )
  )

  return [...withoutMatchingTemp, incoming]
}

export function stripTempChatMessage(prev: ApiMessage[], tempId: string): ApiMessage[] {
  return prev.filter((m) => m.id !== tempId)
}
