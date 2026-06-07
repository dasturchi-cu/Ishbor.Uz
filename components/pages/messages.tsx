'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send, Paperclip, Search, Check, CheckCheck } from 'lucide-react'
import { mockConversations, mockMessages } from '@/lib/mock-data'

export function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState(mockConversations[0].id)
  const [messageText, setMessageText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const conversation = mockConversations.find((c) => c.id === selectedConversation)
  const messages = mockMessages.filter((m) => m.conversationId === selectedConversation)

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col lg:flex-row bg-background">
      {/* Conversations List */}
      <div className="w-full lg:w-80 border-r border-border flex flex-col">
        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {mockConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedConversation(conv.id)}
              className={`w-full p-4 border-b border-border text-left hover:bg-secondary transition ${
                selectedConversation === conv.id ? 'bg-secondary' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">{conv.participantNames[1]}</p>
                  <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                  <p className="text-xs text-muted-foreground mt-1">{conv.lastMessageTime}</p>
                </div>
                {conv.unreadCount > 0 && (
                  <div className="w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
                    {conv.unreadCount}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat View */}
      <div className="hidden lg:flex flex-1 flex-col">
        {conversation ? (
          <>
            {/* Chat Header */}
            <div className="border-b border-border p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full" />
                <div>
                  <p className="font-semibold text-foreground">{conversation.participantNames[1]}</p>
                  <p className="text-xs text-green-500">● Online</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  📞
                </Button>
                <Button variant="ghost" size="icon">
                  📹
                </Button>
                <Button variant="ghost" size="icon">
                  ⋮
                </Button>
              </div>
            </div>

            {/* Active Order Card */}
            {conversation.activeOrder && (
              <div className="border-b border-border p-4 bg-secondary">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-foreground">{conversation.activeOrder.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">Budget: {(conversation.activeOrder.price / 1000000).toFixed(1)}M som</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-green-500/20 text-green-700 px-2 py-1 rounded">Active</span>
                      <span className="text-xs text-muted-foreground">Deadline: {conversation.activeOrder.deadline}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderId === 'f1' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs p-3 rounded-lg ${
                      msg.senderId === 'f1'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <div
                      className={`flex items-center gap-1 mt-1 text-xs ${
                        msg.senderId === 'f1'
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      }`}
                    >
                      <span>{msg.timestamp.split(' ')[1]}</span>
                      {msg.senderId === 'f1' && (
                        msg.read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="border-t border-border p-4">
              <div className="flex items-end gap-2">
                <Button variant="ghost" size="icon">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && messageText.trim()) {
                      setMessageText('')
                    }
                  }}
                />
                <Button
                  size="icon"
                  onClick={() => {
                    if (messageText.trim()) {
                      setMessageText('')
                    }
                  }}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  )
}
