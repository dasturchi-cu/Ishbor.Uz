import type { ApiConversation, ApiConversationThread } from '@/infrastructure/api/types'

export type UnifiedChatThread = {
  key: string
  conversationId: string | null
  orderId: string | null
  contractId: string | null
  type: 'order' | 'contract'
  otherUserId: string
  otherUserName: string
  title: string
  status: string | null
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
}

export function threadFromConversationThread(thread: ApiConversationThread): UnifiedChatThread {
  return {
    key: thread.id,
    conversationId: thread.id,
    orderId: thread.order_id ?? null,
    contractId: thread.contract_id ?? null,
    type: thread.type === 'contract' ? 'contract' : 'order',
    otherUserId: thread.other_user_id ?? '',
    otherUserName: thread.other_user_name ?? '—',
    title: thread.title ?? '—',
    status: null,
    lastMessage: thread.last_message ?? null,
    lastMessageAt: thread.last_message_at ?? null,
    unreadCount: thread.unread_count ?? 0,
  }
}

export function threadFromLegacyConversation(
  conv: ApiConversation,
  orderTitleFallback: string
): UnifiedChatThread {
  return {
    key: `order:${conv.order_id}`,
    conversationId: null,
    orderId: conv.order_id,
    contractId: null,
    type: 'order',
    otherUserId: conv.other_user_id,
    otherUserName: conv.other_user_name,
    title: conv.order_title || orderTitleFallback,
    status: conv.order_status,
    lastMessage: conv.last_message,
    lastMessageAt: conv.last_message_at,
    unreadCount: conv.unread_count ?? 0,
  }
}

function messageAtMs(iso: string | null | undefined): number {
  return iso ? new Date(iso).getTime() : 0
}

function pickNewerConversation(a: ApiConversation, b: ApiConversation): ApiConversation {
  return messageAtMs(a.last_message_at) >= messageAtMs(b.last_message_at) ? a : b
}

export function pickNewerThread(a: UnifiedChatThread, b: UnifiedChatThread): UnifiedChatThread {
  const newer = messageAtMs(a.lastMessageAt) >= messageAtMs(b.lastMessageAt) ? a : b
  const older = newer === a ? b : a
  return mergeThreadFields(newer, older)
}

function mergeThreadFields(primary: UnifiedChatThread, secondary: UnifiedChatThread): UnifiedChatThread {
  const orderId = primary.orderId ?? secondary.orderId
  const conversationId = primary.conversationId ?? secondary.conversationId
  const contractId = primary.contractId ?? secondary.contractId
  return {
    ...primary,
    orderId,
    conversationId,
    contractId,
    status: primary.status ?? secondary.status,
    unreadCount: Math.max(primary.unreadCount, secondary.unreadCount),
    key: conversationId ? conversationId : orderId ? `order:${orderId}` : primary.key,
  }
}

function normTitle(title: string): string {
  return title.trim().toLowerCase()
}

/** Bir xil suhbatni aniqlash: order/contract yoki orphan conversation + legacy */
export function threadsMatch(a: UnifiedChatThread, b: UnifiedChatThread): boolean {
  if (a.orderId && b.orderId) return a.orderId === b.orderId
  if (a.contractId && b.contractId) return a.contractId === b.contractId
  if (a.type !== 'order' || b.type !== 'order') return false
  if (!a.otherUserId || !b.otherUserId || a.otherUserId !== b.otherUserId) return false
  if (normTitle(a.title) !== normTitle(b.title)) return false
  return true
}

/** React ro'yxati uchun barqaror kalit */
export function stableThreadKey(thread: UnifiedChatThread): string {
  if (thread.orderId) return `order:${thread.orderId}`
  if (thread.contractId) return `contract:${thread.contractId}`
  if (thread.otherUserId && thread.title) {
    return `peer:${thread.otherUserId}:${normTitle(thread.title)}`
  }
  return thread.key
}

export function finalizeInboxThreads(rows: UnifiedChatThread[]): UnifiedChatThread[] {
  const groups: UnifiedChatThread[][] = []

  for (const row of rows) {
    const idx = groups.findIndex((group) => threadsMatch(group[0], row))
    if (idx < 0) groups.push([row])
    else groups[idx].push(row)
  }

  return groups
    .map((group) => group.reduce((acc, row) => mergeThreadFields(pickNewerThread(acc, row), acc)))
    .sort((a, b) => messageAtMs(b.lastMessageAt) - messageAtMs(a.lastMessageAt))
}

/** Inbox API javobidan bitta ro'yxat (threads + legacy, client-side dedupe). */
export function buildInboxFromBundle(
  threads: ApiConversationThread[],
  legacyConversations: ApiConversation[],
  orderTitleFallback: string
): UnifiedChatThread[] {
  return mergeUnifiedChatThreads(threads, legacyConversations, orderTitleFallback)
}

export function mergeUnifiedChatThreads(
  threads: ApiConversationThread[],
  legacyConversations: ApiConversation[],
  orderTitleFallback: string
): UnifiedChatThread[] {
  const coveredOrderIds = new Set<string>()
  const threadsByOrder = new Map<string, UnifiedChatThread>()
  const threadsByContract = new Map<string, UnifiedChatThread>()
  const standaloneThreads: UnifiedChatThread[] = []

  for (const thread of threads) {
    const row = threadFromConversationThread(thread)
    if (row.orderId) {
      const existing = threadsByOrder.get(row.orderId)
      threadsByOrder.set(row.orderId, existing ? pickNewerThread(row, existing) : row)
      continue
    }
    if (row.contractId) {
      const existing = threadsByContract.get(row.contractId)
      threadsByContract.set(row.contractId, existing ? pickNewerThread(row, existing) : row)
      continue
    }
    standaloneThreads.push(row)
  }

  const normalizedThreads = [
    ...threadsByOrder.values(),
    ...threadsByContract.values(),
    ...standaloneThreads,
  ]

  const merged: UnifiedChatThread[] = []
  for (const row of normalizedThreads) {
    merged.push(row)
    if (row.orderId) coveredOrderIds.add(row.orderId)
  }

  const legacyByOrder = new Map<string, ApiConversation>()
  for (const conv of legacyConversations) {
    if (coveredOrderIds.has(conv.order_id)) continue
    const existing = legacyByOrder.get(conv.order_id)
    legacyByOrder.set(conv.order_id, existing ? pickNewerConversation(conv, existing) : conv)
  }

  for (const conv of legacyByOrder.values()) {
    merged.push(threadFromLegacyConversation(conv, orderTitleFallback))
  }

  return finalizeInboxThreads(merged)
}
