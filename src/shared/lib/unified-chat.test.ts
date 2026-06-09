import { describe, expect, it } from 'vitest'
import {
  finalizeInboxThreads,
  mergeUnifiedChatThreads,
  stableThreadKey,
  threadFromConversationThread,
  threadFromLegacyConversation,
} from '@/shared/lib/unified-chat'
import type { ApiConversation, ApiConversationThread } from '@/infrastructure/api/types'

describe('mergeUnifiedChatThreads', () => {
  it('prefers conversation threads and dedupes legacy order conversations', () => {
    const threads: ApiConversationThread[] = [
      {
        id: 'conv-1',
        type: 'contract',
        contract_id: 'contract-1',
        order_id: null,
        participant_ids: ['u1', 'u2'],
        other_user_id: 'u2',
        other_user_name: 'Ali',
        title: 'Shartnoma',
        last_message: 'Salom',
        last_message_at: '2026-06-09T12:00:00Z',
        unread_count: 1,
      },
      {
        id: 'conv-2',
        type: 'order',
        order_id: 'order-1',
        contract_id: null,
        participant_ids: ['u1', 'u3'],
        other_user_id: 'u3',
        other_user_name: 'Vali',
        title: 'Logo dizayn',
        last_message: 'Rahmat',
        last_message_at: '2026-06-09T11:00:00Z',
        unread_count: 0,
      },
    ]

    const legacy: ApiConversation[] = [
      {
        order_id: 'order-1',
        other_user_id: 'u3',
        other_user_name: 'Vali',
        order_title: 'Logo dizayn',
        order_status: 'active',
        last_message: 'Eski',
        last_message_at: '2026-06-08T10:00:00Z',
        unread_count: 2,
      },
      {
        order_id: 'order-2',
        other_user_id: 'u4',
        other_user_name: 'Sardor',
        order_title: 'Sayt',
        order_status: 'pending',
        last_message: null,
        last_message_at: '2026-06-09T09:00:00Z',
        unread_count: 0,
      },
    ]

    const merged = mergeUnifiedChatThreads(threads, legacy, 'Buyurtma')
    expect(merged).toHaveLength(3)
    expect(merged[0].key).toBe('conv-1')
    expect(merged.find((row) => row.orderId === 'order-2')?.key).toBe('order:order-2')
    expect(merged.filter((row) => row.orderId === 'order-1')).toHaveLength(1)
  })

  it('dedupes duplicate legacy rows for the same order_id', () => {
    const legacy: ApiConversation[] = [
      {
        order_id: 'order-1',
        other_user_id: 'u2',
        other_user_name: 'Ali',
        order_title: 'Logo',
        order_status: 'active',
        last_message: 'Eski',
        last_message_at: '2026-06-08T10:00:00Z',
        unread_count: 0,
      },
      {
        order_id: 'order-1',
        other_user_id: 'u2',
        other_user_name: 'Ali',
        order_title: 'Logo',
        order_status: 'active',
        last_message: 'Yangi',
        last_message_at: '2026-06-09T12:00:00Z',
        unread_count: 1,
      },
    ]

    const merged = mergeUnifiedChatThreads([], legacy, 'Buyurtma')
    expect(merged).toHaveLength(1)
    expect(merged[0].key).toBe('order:order-1')
    expect(merged[0].lastMessage).toBe('Yangi')
  })

  it('dedupes multiple conversation threads for the same order_id', () => {
    const threads: ApiConversationThread[] = [
      {
        id: 'conv-old',
        type: 'order',
        order_id: 'order-1',
        contract_id: null,
        participant_ids: ['u1', 'u2'],
        other_user_id: 'u2',
        other_user_name: 'tes',
        title: 'test',
        last_message: 'Eski',
        last_message_at: '2026-06-09T10:00:00Z',
        unread_count: 0,
      },
      {
        id: 'conv-new',
        type: 'order',
        order_id: 'order-1',
        contract_id: null,
        participant_ids: ['u1', 'u2'],
        other_user_id: 'u2',
        other_user_name: 'tes',
        title: 'test',
        last_message: 'Yangi',
        last_message_at: '2026-06-09T11:21:00Z',
        unread_count: 1,
      },
    ]

    const merged = mergeUnifiedChatThreads(threads, [], 'Buyurtma')
    expect(merged).toHaveLength(1)
    expect(merged[0].orderId).toBe('order-1')
    expect(merged[0].lastMessage).toBe('Yangi')
    expect(merged[0].key).toBe('conv-new')
  })

  it('merges orphan conversation thread with legacy order inbox row', () => {
    const threads: ApiConversationThread[] = [
      {
        id: 'conv-orphan',
        type: 'order',
        order_id: null,
        contract_id: null,
        participant_ids: ['u1', 'u2'],
        other_user_id: 'u2',
        other_user_name: 'tes',
        title: 'test',
        last_message: 'Salom',
        last_message_at: '2026-06-09T11:21:00Z',
        unread_count: 0,
      },
    ]
    const legacy: ApiConversation[] = [
      {
        order_id: 'order-1',
        other_user_id: 'u2',
        other_user_name: 'tes',
        order_title: 'test',
        order_status: 'active',
        last_message: 'Salom',
        last_message_at: '2026-06-09T11:21:00Z',
        unread_count: 0,
      },
    ]

    const merged = mergeUnifiedChatThreads(threads, legacy, 'Buyurtma')
    expect(merged).toHaveLength(1)
    expect(merged[0].orderId).toBe('order-1')
    expect(merged[0].conversationId).toBe('conv-orphan')
    expect(stableThreadKey(merged[0])).toBe('order:order-1')
  })
})

describe('finalizeInboxThreads', () => {
  it('collapses duplicate peer+title rows without order_id', () => {
    const rows = [
      threadFromConversationThread({
        id: 'conv-a',
        type: 'order',
        order_id: null,
        contract_id: null,
        participant_ids: ['u1', 'u2'],
        other_user_id: 'u2',
        other_user_name: 'tes',
        title: 'test',
        last_message: '1',
        last_message_at: '2026-06-09T11:21:00Z',
        unread_count: 0,
      }),
      threadFromConversationThread({
        id: 'conv-b',
        type: 'order',
        order_id: null,
        contract_id: null,
        participant_ids: ['u1', 'u2'],
        other_user_id: 'u2',
        other_user_name: 'tes',
        title: 'test',
        last_message: '2',
        last_message_at: '2026-06-09T11:21:00Z',
        unread_count: 1,
      }),
      threadFromLegacyConversation(
        {
          order_id: 'order-1',
          other_user_id: 'u2',
          other_user_name: 'tes',
          order_title: 'test',
          order_status: 'active',
          last_message: '3',
          last_message_at: '2026-06-09T11:21:00Z',
          unread_count: 0,
        },
        'Buyurtma'
      ),
    ]

    const merged = finalizeInboxThreads(rows)
    expect(merged).toHaveLength(1)
    expect(merged[0].orderId).toBe('order-1')
    expect(merged[0].conversationId).toBe('conv-a')
    expect(merged[0].unreadCount).toBe(1)
  })
})
