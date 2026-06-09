import { describe, expect, it } from 'vitest'
import { mergeIncomingChatMessage } from './chat-message-merge'
import type { ApiMessage } from '@/infrastructure/api/types'

const temp: ApiMessage = {
  id: 'temp-1',
  sender_id: 'u1',
  receiver_id: 'u2',
  content: 'salom',
  read_at: null,
  created_at: '2026-06-09T10:00:00.000Z',
}

const real: ApiMessage = {
  id: 'real-uuid',
  sender_id: 'u1',
  receiver_id: 'u2',
  content: 'salom',
  read_at: null,
  created_at: '2026-06-09T10:00:01.000Z',
}

describe('mergeIncomingChatMessage', () => {
  it('replaces matching optimistic temp with server message', () => {
    const result = mergeIncomingChatMessage([temp], real)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('real-uuid')
  })

  it('ignores duplicate server id', () => {
    const result = mergeIncomingChatMessage([real], real)
    expect(result).toHaveLength(1)
  })

  it('keeps unrelated temp messages', () => {
    const otherTemp: ApiMessage = { ...temp, id: 'temp-2', content: 'boshqa' }
    const result = mergeIncomingChatMessage([temp, otherTemp], real)
    expect(result).toHaveLength(2)
    expect(result.some((m) => m.id === 'temp-2')).toBe(true)
    expect(result.some((m) => m.id === 'real-uuid')).toBe(true)
  })
})
