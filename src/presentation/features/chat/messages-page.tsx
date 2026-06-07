'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { Input } from '@/presentation/components/ui/input'
import { Button } from '@/presentation/components/ui/button'
import { Send, Search } from 'lucide-react'
import { api } from '@/infrastructure/api/client'
import type { ApiConversation, ApiMessage, ApiOrder } from '@/infrastructure/api/types'

function orderToConversation(order: ApiOrder, userId: string): ApiConversation {
  const isClient = order.client_id === userId
  const otherProfile = isClient ? order.freelancer_profile : order.client_profile
  return {
    order_id: order.id,
    other_user_id: isClient ? order.freelancer_id : order.client_id,
    other_user_name: otherProfile?.full_name ?? '—',
    order_title: order.services?.title ?? 'Buyurtma',
    order_status: order.status,
    last_message: null,
    last_message_at: order.created_at ?? null,
    unread_count: 0,
  }
}

function mergeConversations(
  convs: ApiConversation[],
  orders: ApiOrder[],
  userId: string
): ApiConversation[] {
  const byOrder = new Map<string, ApiConversation>()
  for (const order of orders) {
    byOrder.set(order.id, orderToConversation(order, userId))
  }
  for (const conv of convs) {
    byOrder.set(conv.order_id, conv)
  }
  return Array.from(byOrder.values()).sort((a, b) => {
    const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
    const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
    return bTime - aTime
  })
}

export function MessagesPage() {
  const { t, userId } = useApp()
  const searchParams = useSearchParams()
  const orderFromUrl = searchParams.get('order')

  const [conversations, setConversations] = useState<ApiConversation[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(orderFromUrl)
  const [messages, setMessages] = useState<ApiMessage[]>([])
  const [messageText, setMessageText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (orderFromUrl) {
      setSelectedOrderId(orderFromUrl)
    }
  }, [orderFromUrl])

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    setLoading(true)
    Promise.all([
      api.listConversations().catch(() => [] as ApiConversation[]),
      api.listOrders().catch(() => [] as ApiOrder[]),
    ])
      .then(([convs, orders]) => {
        const merged = mergeConversations(convs, orders, userId)
        setConversations(merged)

        if (orderFromUrl && merged.some((c) => c.order_id === orderFromUrl)) {
          setSelectedOrderId(orderFromUrl)
        } else if (!orderFromUrl && merged.length > 0) {
          setSelectedOrderId((cur) => cur ?? merged[0].order_id)
        }
      })
      .finally(() => setLoading(false))
  }, [userId, orderFromUrl])

  useEffect(() => {
    if (!selectedOrderId) return
    const interval = setInterval(() => {
      api.listMessages(selectedOrderId).then(setMessages).catch(() => setMessages([]))
    }, 5000)
    api.listMessages(selectedOrderId).then(setMessages).catch(() => setMessages([]))
    return () => clearInterval(interval)
  }, [selectedOrderId])

  const send = async () => {
    if (!selectedOrderId || !messageText.trim()) return
    await api.sendMessage(selectedOrderId, messageText.trim())
    setMessageText('')
    const updated = await api.listMessages(selectedOrderId)
    setMessages(updated)
    const convs = await api.listConversations()
    const orders = await api.listOrders().catch(() => [] as ApiOrder[])
    if (userId) {
      setConversations(mergeConversations(convs, orders, userId))
    }
  }

  const filtered = conversations.filter(
    (c) =>
      c.other_user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.order_title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const active = useMemo(
    () => conversations.find((c) => c.order_id === selectedOrderId) ?? null,
    [conversations, selectedOrderId]
  )

  const showChat = Boolean(selectedOrderId && active)
  const showSelectHint = !loading && conversations.length > 0 && !showChat
  const showEmptyInbox = !loading && conversations.length === 0

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col lg:flex-row bg-background">
      <div className="w-full lg:w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search_conversations')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && <p className="p-4 text-sm text-muted-foreground">{t('loading_data')}</p>}
          {!loading && filtered.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">{t('messages_no_conversations')}</p>
          )}
          {filtered.map((conv) => (
            <button
              key={conv.order_id}
              type="button"
              onClick={() => setSelectedOrderId(conv.order_id)}
              className={`w-full p-4 border-b border-border text-left hover:bg-secondary transition ${
                selectedOrderId === conv.order_id ? 'bg-secondary' : ''
              }`}
            >
              <p className="font-semibold text-sm">{conv.other_user_name}</p>
              <p className="text-xs text-muted-foreground truncate">{conv.order_title}</p>
              {conv.last_message ? (
                <p className="text-xs text-muted-foreground truncate mt-1">{conv.last_message}</p>
              ) : (
                <p className="text-xs text-muted-foreground truncate mt-1 italic">
                  {t('messages_no_messages_yet')}
                </p>
              )}
              {conv.unread_count > 0 && (
                <span className="inline-block mt-1 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  {conv.unread_count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {showChat && active ? (
          <>
            <div className="border-b border-border p-4">
              <p className="font-semibold">{active.other_user_name}</p>
              <p className="text-xs text-muted-foreground">{active.order_title}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {t('messages_no_messages_yet')}
                </p>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-xs p-3 rounded-lg text-sm ${
                      msg.sender_id === userId
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border p-4 flex gap-2">
              <Input
                placeholder={t('type_message')}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
              />
              <Button size="icon" onClick={send}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : showEmptyInbox ? (
          <div className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground max-w-md mx-auto">
            <p className="text-sm leading-relaxed">{t('messages_no_conversations')}</p>
          </div>
        ) : showSelectHint ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            {t('select_conversation')}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            {t('loading_data')}
          </div>
        )}
      </div>
    </div>
  )
}
