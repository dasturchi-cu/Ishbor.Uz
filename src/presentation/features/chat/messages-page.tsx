'use client'

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { Avatar } from '@/presentation/components/ui/avatar'
import { ArrowLeft, BellOff, Check, CheckCheck, ExternalLink, Paperclip, Search, Send } from 'lucide-react'
import { api } from '@/infrastructure/api/client'
import type { ApiConversation, ApiMessage, ApiOrder } from '@/infrastructure/api/types'
import { cn } from '@/shared/lib/utils'
import { toast } from '@/presentation/components/ui/toast'
import { formatDateShort, formatTime } from '@/shared/lib/format-date'
import { useOrderMessagesRealtime } from '@/shared/lib/use-order-messages-realtime'
import { useConversationMessagesRealtime } from '@/shared/lib/use-conversation-messages-realtime'
import { useInboxRealtime } from '@/shared/lib/use-inbox-realtime'
import { useOrderTyping } from '@/shared/lib/use-order-typing'
import {
  mergeUnifiedChatThreads,
  stableThreadKey,
  type UnifiedChatThread,
} from '@/shared/lib/unified-chat'
import { uploadChatImage } from '@/infrastructure/supabase/storage'
import { isSupabaseConfigured } from '@/infrastructure/supabase/client'
import type { Language } from '@/infrastructure/i18n'
import { Skeleton, SkeletonAvatar } from '@/presentation/components/ui/skeleton'
import { OrderStatusBadge } from '@/presentation/components/features/order-status-badge'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { Button } from '@/presentation/components/ui/button'
import { Alert } from '@/presentation/components/ui/alert'
import { dashboardContract, dashboardOrderPath, PATHS } from '@/domain/constants/routes'
import { isAllowedExternalUrl } from '@/shared/lib/safe-url'

function orderToLegacyConversation(order: ApiOrder, userId: string, orderTitleFallback: string): ApiConversation {
  const isClient = order.client_id === userId
  const otherProfile = isClient ? order.freelancer_profile : order.client_profile
  return {
    order_id: order.id,
    other_user_id: isClient ? order.freelancer_id : order.client_id,
    other_user_name: otherProfile?.full_name ?? '—',
    order_title: order.services?.title ?? orderTitleFallback,
    order_status: order.status,
    last_message: null,
    last_message_at: order.created_at ?? null,
    unread_count: 0,
  }
}

function buildUnifiedInbox(
  threads: Awaited<ReturnType<typeof api.listConversationThreads>>,
  legacyConvs: ApiConversation[],
  orders: ApiOrder[],
  userId: string,
  orderTitleFallback: string
): UnifiedChatThread[] {
  const threadOrderIds = new Set(
    threads.map((thread) => thread.order_id).filter((id): id is string => Boolean(id))
  )
  const legacyOrderIds = new Set(legacyConvs.map((conv) => conv.order_id))
  const legacyFromOrders = orders
    .filter((order) => !threadOrderIds.has(order.id) && !legacyOrderIds.has(order.id))
    .map((order) => orderToLegacyConversation(order, userId, orderTitleFallback))
  return mergeUnifiedChatThreads(threads, [...legacyConvs, ...legacyFromOrders], orderTitleFallback)
}

async function loadThreadMessages(thread: UnifiedChatThread): Promise<ApiMessage[]> {
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

function messageAttachmentUrl(content: string): string | null {
  const match = content.match(/https?:\/\/\S+/i)
  if (!match) return null
  const url = match[0].replace(/[),.]+$/, '')
  return isAllowedExternalUrl(url) ? url : null
}

function messageImageUrl(content: string): string | null {
  const url = messageAttachmentUrl(content)
  if (!url) return null
  if (/\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url)) return url
  return null
}

function formatMessageTime(dateStr: string | null | undefined, language: Language): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  return isToday ? formatTime(d, language) : formatDateShort(d, language)
}

function ChatEmptyState({
  text,
  hint,
  action,
}: {
  text: string
  hint?: string
  action?: { label: string; onClick: () => void; variant?: 'primary' | 'outline' }
}) {
  return (
    <EmptyState
      icon={<Send className="h-14 w-14" />}
      title={text}
      description={hint}
      action={
        action
          ? {
              label: action.label,
              onClick: action.onClick,
              variant: action.variant ?? 'primary',
            }
          : undefined
      }
    />
  )
}

export function MessagesPage() {
  const { t, userId, language } = useApp()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const orderFromUrl = searchParams.get('order')
  const contractFromUrl = searchParams.get('contract')
  const conversationFromUrl = searchParams.get('conversation')
  const inDashboard = pathname.startsWith('/dashboard')

  const [conversations, setConversations] = useState<UnifiedChatThread[]>([])
  const [selectedKey, setSelectedKey] = useState<string | null>(conversationFromUrl ?? orderFromUrl)
  const [messages, setMessages] = useState<ApiMessage[]>([])
  const [messageText, setMessageText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [muted, setMuted] = useState(false)
  const [prefsLoaded, setPrefsLoaded] = useState(false)
  const [attachLoading, setAttachLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [inboxLoadError, setInboxLoadError] = useState(false)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [messagesLoadError, setMessagesLoadError] = useState(false)
  const [sendLoading, setSendLoading] = useState(false)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [activeOnly, setActiveOnly] = useState(false)
  const [peerTyping, setPeerTyping] = useState(false)
  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (conversationFromUrl) {
      setSelectedKey(conversationFromUrl)
      return
    }
    if (orderFromUrl) {
      setSelectedKey(`order:${orderFromUrl}`)
    }
  }, [conversationFromUrl, orderFromUrl])

  useEffect(() => {
    if (!contractFromUrl || conversationFromUrl || orderFromUrl) return
    api
      .getContract(contractFromUrl)
      .then((contract) => {
        const match = conversations.find((thread) => thread.contractId === contract.id)
        if (match) {
          setSelectedKey(match.key)
        } else if (contract.order_id) {
          setSelectedKey(`order:${contract.order_id}`)
        }
      })
      .catch(() => undefined)
  }, [contractFromUrl, conversationFromUrl, orderFromUrl, conversations])

  useEffect(() => {
    api
      .getNotificationPrefs()
      .then((prefs) => {
        setMuted(prefs.chatMuted)
        setPrefsLoaded(true)
      })
      .catch(() => setPrefsLoaded(true))
  }, [])

  const refreshConversations = useCallback(() => {
    if (!userId) return
    setInboxLoadError(false)
    Promise.all([
      api.listConversationThreads().catch(() => {
        setInboxLoadError(true)
        return []
      }),
      api.listConversations().catch(() => {
        setInboxLoadError(true)
        return [] as ApiConversation[]
      }),
      api.listOrders().catch(() => {
        setInboxLoadError(true)
        return [] as ApiOrder[]
      }),
    ]).then(([threads, legacyConvs, orders]) => {
      setConversations(
        buildUnifiedInbox(threads, legacyConvs, orders, userId, t('order_title_fallback'))
      )
    })
  }, [userId, t])

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setInboxLoadError(false)
    Promise.all([
      api.listConversationThreads().catch(() => {
        setInboxLoadError(true)
        return []
      }),
      api.listConversations().catch(() => {
        setInboxLoadError(true)
        return [] as ApiConversation[]
      }),
      api.listOrders().catch(() => {
        setInboxLoadError(true)
        return [] as ApiOrder[]
      }),
    ])
      .then(([threads, legacyConvs, orders]) => {
        const merged = buildUnifiedInbox(threads, legacyConvs, orders, userId, t('order_title_fallback'))
        setConversations(merged)

        if (conversationFromUrl && merged.some((thread) => thread.key === conversationFromUrl)) {
          setSelectedKey(conversationFromUrl)
        } else if (orderFromUrl) {
          const orderThread = merged.find(
            (thread) => thread.orderId === orderFromUrl || thread.key === `order:${orderFromUrl}`
          )
          if (orderThread) setSelectedKey(orderThread.key)
        } else if (merged.length > 0) {
          setSelectedKey((cur) => cur ?? merged[0].key)
        }
      })
      .finally(() => setLoading(false))
  }, [userId, conversationFromUrl, orderFromUrl, t])

  useInboxRealtime(userId, refreshConversations)

  const onRealtimeMessage = useCallback((msg: ApiMessage) => {
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
    setPeerTyping(false)
  }, [])

  const onRealtimeMessageUpdate = useCallback((msg: ApiMessage) => {
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, ...msg } : m)))
  }, [])

  const activeThread = useMemo(() => {
    if (!selectedKey) return null
    return (
      conversations.find(
        (thread) => thread.key === selectedKey || stableThreadKey(thread) === selectedKey
      ) ?? null
    )
  }, [conversations, selectedKey])

  useConversationMessagesRealtime(
    activeThread?.conversationId ?? null,
    onRealtimeMessage,
    onRealtimeMessageUpdate
  )
  useOrderMessagesRealtime(activeThread?.orderId ?? null, onRealtimeMessage, onRealtimeMessageUpdate)

  const sendTyping = useOrderTyping(activeThread?.orderId ?? null, userId, setPeerTyping)

  useEffect(() => {
    if (!activeThread) return
    setMessagesLoading(true)
    setMessagesLoadError(false)
    void loadThreadMessages(activeThread)
      .then((rows) => {
        setMessages(rows)
        if (activeThread.conversationId) {
          void api.markConversationRead(activeThread.conversationId).catch(() => undefined)
        }
      })
      .catch(() => {
        setMessages([])
        setMessagesLoadError(true)
      })
      .finally(() => setMessagesLoading(false))
  }, [activeThread])

  const handleAttach = async (file: File) => {
    if (!activeThread || !userId) return
    if (!isSupabaseConfigured()) {
      toast.error(t('auth_supabase_not_configured'))
      return
    }
    setAttachLoading(true)
    try {
      const scopeId = activeThread.orderId ?? activeThread.conversationId ?? activeThread.key
      const url = await uploadChatImage(file, userId, scopeId)
      const content = `${t('chat_attachment_label')}: ${url}`
      if (activeThread.conversationId) {
        await api.sendConversationMessage(activeThread.conversationId, content, 'image')
        const updated = await api.listConversationMessages(activeThread.conversationId)
        setMessages(updated)
      } else if (activeThread.orderId) {
        await api.sendMessage(activeThread.orderId, content)
        const updated = await api.listMessages(activeThread.orderId)
        setMessages(updated)
      }
      refreshConversations()
      toast.success(t('save_success'))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('error_required'))
    } finally {
      setAttachLoading(false)
    }
  }

  const send = async () => {
    if (!activeThread || !messageText.trim() || !userId || sendLoading) return
    const text = messageText.trim()
    const tempId = `temp-${Date.now()}`
    const optimistic: ApiMessage = {
      id: tempId,
      order_id: activeThread.orderId ?? undefined,
      conversation_id: activeThread.conversationId ?? undefined,
      sender_id: userId,
      receiver_id: activeThread.otherUserId,
      content: text,
      read_at: null,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])
    setMessageText('')
    setSendLoading(true)
    try {
      if (activeThread.conversationId) {
        await api.sendConversationMessage(activeThread.conversationId, text)
        const updated = await api.listConversationMessages(activeThread.conversationId)
        setMessages(updated)
      } else if (activeThread.orderId) {
        await api.sendMessage(activeThread.orderId, text)
        const updated = await api.listMessages(activeThread.orderId)
        setMessages(updated)
      }
      refreshConversations()
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      setMessageText(text)
      toast.error(t('error_required'))
    } finally {
      setSendLoading(false)
    }
  }

  useEffect(() => {
    if (!activeThread?.orderId || !messageText.trim()) {
      sendTyping(false)
      return
    }
    sendTyping(true)
    if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current)
    typingDebounceRef.current = setTimeout(() => sendTyping(false), 2000)
    return () => {
      if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current)
    }
  }, [messageText, activeThread?.orderId, sendTyping])

  const filtered = useMemo(() => {
    const activeStatuses = new Set(['pending', 'active', 'delivered'])
    return conversations.filter((thread) => {
      if (unreadOnly && (thread.unreadCount ?? 0) === 0) return false
      if (activeOnly && thread.status && !activeStatuses.has(thread.status)) return false
      const q = searchQuery.toLowerCase()
      return (
        thread.otherUserName.toLowerCase().includes(q) ||
        thread.title.toLowerCase().includes(q) ||
        (thread.lastMessage?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [conversations, searchQuery, unreadOnly, activeOnly])

  const showChat = Boolean(selectedKey && activeThread)

  return (
    <div className={cn('chat-layout', inDashboard && 'chat-layout--dashboard', showChat && 'chat-layout--thread')}>
      <aside className="chat-sidebar">
        <div className="chat-sidebar-toolbar">
          <div className="chat-search">
            <Search aria-hidden />
            <input
              type="text"
              className="kwork-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('messages_search_chats')}
              aria-label={t('messages_search_chats')}
            />
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              className={cn('chat-filter-btn', unreadOnly && 'chat-filter-btn--active')}
              onClick={() => setUnreadOnly((v) => !v)}
            >
              {t('messages_filter_unread')}
            </button>
            <button
              type="button"
              className={cn('chat-filter-btn', activeOnly && 'chat-filter-btn--active')}
              onClick={() => setActiveOnly((v) => !v)}
            >
              {t('messages_filter_active')}
            </button>
            <button
              type="button"
              className={cn('chat-mute-btn', muted && 'chat-mute-btn--active')}
              onClick={() => {
                const next = !muted
                setMuted(next)
                if (prefsLoaded) {
                  api.updateNotificationPrefs({ chatMuted: next }).catch(() => setMuted(!next))
                }
              }}
              aria-label={t('messages_mute_label')}
              aria-pressed={muted}
            >
              <BellOff className="h-4 w-4" />
            </button>
          </div>
        </div>

        {inboxLoadError && !loading && (
          <Alert variant="error" className="mx-2 mb-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>{t('data_load_failed')}</span>
              <Button variant="outline" size="sm" onClick={refreshConversations}>
                {t('catalog_retry')}
              </Button>
            </div>
          </Alert>
        )}

        <div className="chat-list">
          {loading && (
            <div className="space-y-2 p-2" role="status" aria-live="polite">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg px-2 py-2.5">
                  <SkeletonAvatar size={40} />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-full max-w-[180px]" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && !inboxLoadError && filtered.length === 0 && (
            <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
              <p className="chat-list-empty">{t('messages_no_conversations')}</p>
              <p className="text-[12px] text-[var(--kwork-text-muted)]">{t('messages_empty_hint')}</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => router.push(PATHS.services)}>
                  {t('messages_browse_cta')}
                </Button>
                <Button variant="primary" size="sm" onClick={() => router.push(PATHS.dashboardOrders)}>
                  {t('nav_orders')}
                </Button>
              </div>
            </div>
          )}
          {!loading &&
            filtered.map((thread) => {
            const listKey = stableThreadKey(thread)
            return (
            <button
              key={listKey}
              type="button"
              onClick={() => setSelectedKey(thread.key)}
              className={cn(
                'chat-list-item',
                (selectedKey === thread.key || selectedKey === listKey) && 'chat-list-item--active'
              )}
            >
              <Avatar name={thread.otherUserName} size={40} />
              <div className="chat-list-item-body">
                <div className="chat-list-item-top">
                  <p className="chat-list-item-name">{thread.otherUserName}</p>
                  {thread.lastMessageAt && (
                    <span className="chat-list-item-time">
                      {formatMessageTime(thread.lastMessageAt, language)}
                    </span>
                  )}
                </div>
                <p className="chat-list-item-preview">
                  <span className="mr-1 text-[10px] font-semibold uppercase text-[var(--color-primary)]">
                    {thread.type === 'contract' ? t('chat_thread_contract') : t('chat_thread_order')}
                  </span>
                  {thread.lastMessage ?? thread.title}
                </p>
              </div>
              {thread.unreadCount > 0 && (
                <span className="chat-list-unread">{thread.unreadCount}</span>
              )}
            </button>
            )
          })}
        </div>
      </aside>

      <section className="chat-main">
        {showChat && activeThread ? (
          <>
            <header className="chat-header">
              <button
                type="button"
                className="chat-back-btn show-mobile"
                onClick={() => setSelectedKey(null)}
                aria-label={t('chat_back')}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <Avatar name={activeThread.otherUserName} size={40} />
              <div className="min-w-0 flex-1">
                <p className="chat-header-name">{activeThread.otherUserName}</p>
                <p className="chat-header-sub">
                  {peerTyping ? t('chat_typing') : activeThread.title}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {activeThread.status && <OrderStatusBadge status={activeThread.status} />}
                  {activeThread.contractId ? (
                    <Link
                      href={dashboardContract(activeThread.contractId)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-primary)] hover:underline"
                    >
                      {t('chat_thread_contract')}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : activeThread.orderId ? (
                    <Link
                      href={dashboardOrderPath(activeThread.orderId)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-primary)] hover:underline"
                    >
                      {t('nav_orders')}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : null}
                </div>
              </div>
            </header>

            <div className="chat-messages">
              {messagesLoading && (
                <div className="space-y-4 p-4" role="status" aria-live="polite">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={cn('flex gap-2', i % 2 === 1 && 'flex-row-reverse')}>
                      <SkeletonAvatar size={36} />
                      <Skeleton className={cn('h-14 rounded-2xl', i % 2 === 0 ? 'w-[60%]' : 'w-[45%]')} />
                    </div>
                  ))}
                </div>
              )}
              {!messagesLoading && messagesLoadError && (
                <div className="p-4">
                  <Alert variant="error">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span>{t('data_load_failed')}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!activeThread) return
                          setMessagesLoading(true)
                          setMessagesLoadError(false)
                          loadThreadMessages(activeThread)
                            .then(setMessages)
                            .catch(() => {
                              setMessages([])
                              setMessagesLoadError(true)
                            })
                            .finally(() => setMessagesLoading(false))
                        }}
                      >
                        {t('catalog_retry')}
                      </Button>
                    </div>
                  </Alert>
                </div>
              )}
              {!messagesLoading && !messagesLoadError && messages.length === 0 && (
                <ChatEmptyState text={t('messages_no_messages_yet')} />
              )}
              {!messagesLoading && messages.map((msg, idx) => {
                const isMine = msg.sender_id === userId
                const dayKey = (iso: string) => iso.slice(0, 10)
                const showDate =
                  idx === 0 ||
                  (messages[idx - 1]?.created_at &&
                    msg.created_at &&
                    dayKey(messages[idx - 1].created_at!) !== dayKey(msg.created_at))

                return (
                  <Fragment key={msg.id}>
                    {showDate && msg.created_at && (
                      <p className="chat-date-label">
                        {dayKey(msg.created_at) === dayKey(new Date().toISOString())
                          ? t('messages_today')
                          : formatDateShort(msg.created_at, language)}
                      </p>
                    )}
                    <div className={cn('chat-bubble-row', isMine && 'chat-bubble-row--mine')}>
                      {!isMine && <Avatar name={activeThread.otherUserName} size={36} />}
                      <div
                        className={cn(
                          'chat-bubble',
                          isMine ? 'chat-bubble--mine' : 'chat-bubble--theirs'
                        )}
                      >
                        {(() => {
                          const img = messageImageUrl(msg.content)
                          if (img) {
                            return (
                              <a href={img} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={img}
                                  alt={t('chat_attachment_image')}
                                  className="max-h-48 max-w-full rounded-md object-cover"
                                />
                              </a>
                            )
                          }
                          const fileUrl = messageAttachmentUrl(msg.content)
                          if (fileUrl) {
                            return (
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-[13px] font-medium underline"
                              >
                                <Paperclip className="h-3.5 w-3.5 shrink-0" />
                                {t('chat_attachment_file')}
                                <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
                              </a>
                            )
                          }
                          return <span>{msg.content}</span>
                        })()}
                        <div className="chat-bubble-meta">
                          {msg.created_at && (
                            <p className="chat-bubble-time">{formatMessageTime(msg.created_at, language)}</p>
                          )}
                          {isMine && !msg.id.startsWith('temp-') && (
                            <span
                              className="chat-bubble-read"
                              title={msg.read_at ? t('chat_read') : undefined}
                              aria-label={msg.read_at ? t('chat_read') : undefined}
                            >
                              {msg.read_at ? (
                                <CheckCheck className="h-3 w-3" />
                              ) : (
                                <Check className="h-3 w-3 opacity-60" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Fragment>
                )
              })}
            </div>

            <footer className="chat-composer">
              <div className="chat-templates">
                <p className="chat-templates-label">{t('chat_templates_title')}</p>
                <div className="chat-templates-row">
                  {(['chat_template_hello', 'chat_template_deadline', 'chat_template_files'] as const).map((key) => (
                    <button
                      key={key}
                      type="button"
                      className="chat-template-chip"
                      onClick={() => setMessageText(t(key))}
                    >
                      {t(key)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="chat-composer-box">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void handleAttach(file)
                    e.target.value = ''
                  }}
                />
                <button
                  type="button"
                  className="chat-composer-attach"
                  aria-label={t('attach_file')}
                  disabled={attachLoading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <input
                  className="chat-composer-input kwork-search-input"
                  placeholder={t('type_message_ph')}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                />
                <button
                  type="button"
                  className="chat-composer-send"
                  onClick={send}
                  disabled={!messageText.trim() || sendLoading || attachLoading}
                  aria-label={t('send_message')}
                  aria-busy={sendLoading}
                >
                  <Send className={cn('h-4 w-4', sendLoading && 'animate-pulse')} />
                </button>
              </div>
            </footer>
          </>
        ) : loading ? (
          <div className="chat-empty">
            <p className="chat-empty-text">{t('loading_data')}</p>
          </div>
        ) : conversations.length > 0 ? (
          <ChatEmptyState
            text={t('messages_select_conversation')}
            hint={t('contact_requires_order')}
          />
        ) : (
          <ChatEmptyState
            text={t('messages_empty_history')}
            action={{ label: t('messages_browse_cta'), onClick: () => router.push(PATHS.services) }}
          />
        )}
      </section>
    </div>
  )
}
