import { api } from '@/infrastructure/api/client'
import type { ApiMessage } from '@/infrastructure/api/types'
import type { UnifiedChatThread } from '@/shared/lib/unified-chat'

/** Thread xabarlarini yuklash — conversation yoki order manbasi (bitta strategiya). */
export async function loadThreadMessages(thread: UnifiedChatThread): Promise<ApiMessage[]> {
  if (thread.conversationId) {
    try {
      const rows = await api.listConversationMessages(thread.conversationId)
      if (rows.length > 0 || !thread.orderId) return rows
    } catch {
      if (!thread.orderId) throw new Error('conversation_messages_failed')
    }
    return api.listMessages(thread.orderId)
  }
  if (thread.orderId) return api.listMessages(thread.orderId)
  return []
}
