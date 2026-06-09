'use client'

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { Avatar } from '@/presentation/components/ui/avatar'
import { ArrowLeft, BellOff, Check, CheckCheck, ExternalLink, Paperclip, Phone, Search, Send } from 'lucide-react'
import { api, ApiError } from '@/infrastructure/api/client'
import type { ApiMessage } from '@/infrastructure/api/types'
import { cn } from '@/shared/lib/utils'
import { toast } from '@/presentation/components/ui/toast'
import { formatDateShort, formatTime } from '@/shared/lib/format-date'
import { useOrderMessagesRealtime } from '@/shared/lib/use-order-messages-realtime'
import { useConversationMessagesRealtime } from '@/shared/lib/use-conversation-messages-realtime'
import { useMessagesInbox } from '@/shared/lib/use-messages-inbox'
import { useOrderTyping } from '@/shared/lib/use-order-typing'
import { buildInboxFromBundle, stableThreadKey } from '@/shared/lib/unified-chat'
import { uploadChatImage } from '@/infrastructure/supabase/storage'
import { isSupabaseConfigured } from '@/infrastructure/supabase/client'
import type { Language, TranslationKey } from '@/infrastructure/i18n'
import { Skeleton, SkeletonAvatar } from '@/presentation/components/ui/skeleton'
import { OrderStatusBadge } from '@/presentation/components/features/order-status-badge'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { Button } from '@/presentation/components/ui/button'
import { Alert } from '@/presentation/components/ui/alert'
import { LoadErrorAlert } from '@/presentation/components/ui/load-error-alert'
import { dashboardCallRoom, dashboardContract, dashboardOrderPath, PATHS } from '@/domain/constants/routes'
import { startVideoCall } from '@/shared/lib/start-video-call'
import {
  mergeIncomingChatMessage,
  stripTempChatMessage,
} from '@/shared/lib/chat-message-merge'
import { useAuthReady, useAuthedEffect } from '@/shared/lib/use-auth-ready'
import { loadThreadMessages } from '@/shared/lib/load-thread-messages'
import { resolveActionError } from '@/shared/lib/action-error'
import { chatAttachmentLabelContent } from '@/shared/lib/chat-storage-ref'
import { ChatAttachmentContent } from '@/presentation/components/features/chat-attachment-content'

function resolveChatError(msg: string, t: (key: TranslationKey) => string): string {
  return resolveActionError(msg || null, t, 'message_send')
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
  const { ready, authed } = useAuthReady()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const orderFromUrl = searchParams.get('order')
  const contractFromUrl = searchParams.get('contract')
  const conversationFromUrl = searchParams.get('conversation')
  const inDashboard = pathname.startsWith('/dashboard')

  const {
    threads,
    legacyConversations,
    loading: inboxLoading,
    error: inboxLoadFailed,
    loadError: inboxFetchError,
    refresh: refreshConversations,
  } = useMessagesInbox(userId, ready && authed && Boolean(userId))

  const conversations = useMemo(() => {
    if (!userId) return []
    return buildInboxFromBundle(threads, legacyConversations, t('order_title_fallback'))
  }, [threads, legacyConversations, userId, t])

  const loading = inboxLoading
  const inboxLoadError = inboxLoadFailed
  const [selectedKey, setSelectedKey] = useState<string | null>(conversationFromUrl ?? orderFromUrl)
  const [messages, setMessages] = useState<ApiMessage[]>([])
  const [messageText, setMessageText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [muted, setMuted] = useState(false)
  const [prefsLoaded, setPrefsLoaded] = useState(false)
  const [attachLoading, setAttachLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [messagesLoadError, setMessagesLoadError] = useState<unknown>(null)
  const [sendLoading, setSendLoading] = useState(false)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [activeOnly, setActiveOnly] = useState(false)
  const [peerTyping, setPeerTyping] = useState(false)
  const [callStarting, setCallStarting] = useState(false)
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
    if (!ready || !authed || !contractFromUrl || conversationFromUrl || orderFromUrl) return
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
  }, [ready, authed, contractFromUrl, conversationFromUrl, orderFromUrl, conversations])

  useAuthedEffect(() => {
    api
      .getNotificationPrefs()
      .then((prefs) => {
        setMuted(prefs.chatMuted)
        setPrefsLoaded(true)
      })
      .catch(() => setPrefsLoaded(true))
  }, [])

  useEffect(() => {
    if (conversations.length === 0) return

    if (conversationFromUrl && conversations.some((thread) => thread.key === conversationFromUrl)) {
      setSelectedKey(conversationFromUrl)
      return
    }
    if (orderFromUrl) {
      const orderThread = conversations.find(
        (thread) => thread.orderId === orderFromUrl || thread.key === `order:${orderFromUrl}`
      )
      if (orderThread) setSelectedKey(orderThread.key)
      return
    }
    setSelectedKey((cur) => cur ?? conversations[0]?.key ?? null)
  }, [conversations, conversationFromUrl, orderFromUrl])

  const onRealtimeMessage = useCallback((msg: ApiMessage) => {
    setMessages((prev) => mergeIncomingChatMessage(prev, msg))
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
  useOrderMessagesRealtime(
    activeThread?.conversationId ? null : (activeThread?.orderId ?? null),
    onRealtimeMessage,
    onRealtimeMessageUpdate
  )

  const sendTyping = useOrderTyping(activeThread?.orderId ?? null, userId, setPeerTyping)

  useEffect(() => {
    if (!ready || !authed || !activeThread) return
    setMessagesLoading(true)
    setMessagesLoadError(null)
    void loadThreadMessages(activeThread)
      .then((rows) => {
        setMessages(rows)
        if (activeThread.conversationId) {
          void api.markConversationRead(activeThread.conversationId).catch(() => undefined)
        }
      })
      .catch((e) => {
        setMessages([])
        setMessagesLoadError(e)
      })
      .finally(() => setMessagesLoading(false))
  }, [activeThread, ready, authed])

  const handleAttach = async (file: File) => {
    if (!activeThread || !userId) return
    if (!isSupabaseConfigured()) {
      toast.error(t('auth_supabase_not_configured'))
      return
    }
    setAttachLoading(true)
    try {
      const scopeId = activeThread.orderId ?? activeThread.conversationId ?? activeThread.key
      const storageRef = await uploadChatImage(file, userId, scopeId)
      const content = chatAttachmentLabelContent(t('chat_attachment_label'), storageRef)
      if (activeThread.conversationId) {
        const sent = await api.sendConversationMessage(activeThread.conversationId, content, 'image')
        setMessages((prev) => mergeIncomingChatMessage(prev, sent))
      } else if (activeThread.orderId) {
        const sent = await api.sendMessage(activeThread.orderId, content)
        setMessages((prev) => mergeIncomingChatMessage(prev, sent))
      }
      refreshConversations()
      toast.success(t('save_success'))
    } catch (e) {
      toast.error(resolveChatError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : '', t))
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
        const sent = await api.sendConversationMessage(activeThread.conversationId, text)
        setMessages((prev) =>
          mergeIncomingChatMessage(stripTempChatMessage(prev, tempId), sent)
        )
      } else if (activeThread.orderId) {
        const sent = await api.sendMessage(activeThread.orderId, text)
        setMessages((prev) =>
          mergeIncomingChatMessage(stripTempChatMessage(prev, tempId), sent)
        )
      }
      refreshConversations()
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      setMessageText(text)
      toast.error(resolveChatError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : '', t))
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

  const handleStartCall = async () => {
    if (!activeThread?.otherUserId || callStarting) return
    setCallStarting(true)
    try {
      const session = await startVideoCall({
        calleeId: activeThread.otherUserId,
        conversationId: activeThread.conversationId,
        contractId: activeThread.contractId,
      })
      router.push(dashboardCallRoom(session.id))
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : ''
      toast.error(resolveChatError(msg, t) || t('call_start_failed'))
    } finally {
      setCallStarting(false)
    }
  }

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
  const chatSendBlocked = activeThread?.status === 'cancelled'

  return (
    <div className={cn('chat-layout', inDashboard && 'chat-layout--dashboard', showChat && 'chat-layout--thread')}>
      <aside className="chat-sidebar">
        <div className="chat-sidebar-toolbar">
          <div className="chat-search">
            <Search aria-hidden />
            <input
              type="text"
              className="ishbor-search-input"
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
          <LoadErrorAlert
            error={inboxFetchError}
            scope="messages"
            onRetry={refreshConversations}
            className="mx-2 mb-2"
          />
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
              <p className="text-[12px] text-[var(--ishbor-text-muted)]">{t('messages_empty_hint')}</p>
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
              {activeThread.otherUserId && activeThread.contractId ? (
                <Button
                  variant="outline"
                  size="sm"
                  loading={callStarting}
                  onClick={() => void handleStartCall()}
                  aria-label={t('video_call')}
                  title={t('video_call')}
                >
                  <Phone className="h-4 w-4" aria-hidden />
                </Button>
              ) : null}
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
              {!messagesLoading && messagesLoadError != null && (
                <div className="p-4">
                  <LoadErrorAlert
                    error={messagesLoadError}
                    scope="messages"
                    onRetry={() => {
                      if (!activeThread) return
                      setMessagesLoading(true)
                      setMessagesLoadError(null)
                      loadThreadMessages(activeThread)
                        .then(setMessages)
                        .catch((e) => {
                          setMessages([])
                          setMessagesLoadError(e)
                        })
                        .finally(() => setMessagesLoading(false))
                    }}
                  />
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
                        <ChatAttachmentContent content={msg.content} />
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
              {chatSendBlocked && (
                <Alert variant="info" className="mb-3">
                  {t('chat_order_cancelled_no_send')}
                </Alert>
              )}
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
                  disabled={attachLoading || chatSendBlocked}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <input
                  className="chat-composer-input ishbor-search-input"
                  placeholder={t('type_message_ph')}
                  value={messageText}
                  disabled={chatSendBlocked}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && !chatSendBlocked && send()}
                />
                <button
                  type="button"
                  className="chat-composer-send"
                  onClick={send}
                  disabled={chatSendBlocked || !messageText.trim() || sendLoading || attachLoading}
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
