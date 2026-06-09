import { api } from '@/infrastructure/api/client'
import type { ApiCallSession } from '@/infrastructure/api/types'

export async function startVideoCall(params: {
  calleeId: string
  conversationId?: string | null
  contractId?: string | null
}): Promise<ApiCallSession> {
  const callType = params.contractId ? 'project_discussion' : 'one_to_one'
  return api.startCall({
    callee_id: params.calleeId,
    conversation_id: params.conversationId ?? undefined,
    contract_id: params.contractId ?? undefined,
    call_type: callType,
  })
}
