'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { api } from '@/infrastructure/api/client'
import type { ApiConversation } from '@/infrastructure/api/types'
import { queryKeys } from '@/shared/lib/query-keys'
import { useInboxRealtime } from '@/shared/lib/use-inbox-realtime'

export function useMessagesInbox(userId: string | null | undefined, enabled = true) {
  const queryClient = useQueryClient()

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.messagesInbox })
  }, [queryClient])

  useInboxRealtime(userId, invalidate)

  const query = useQuery({
    queryKey: queryKeys.messagesInbox,
    queryFn: () => api.getMessagesInbox(),
    enabled: enabled && Boolean(userId),
  })

  return {
    threads: query.data?.threads ?? [],
    legacyConversations: query.data?.legacy_conversations ?? ([] as ApiConversation[]),
    loading: query.isLoading,
    error: query.isError,
    loadError: query.error ?? null,
    refresh: invalidate,
    refetch: () => void query.refetch(),
  }
}
