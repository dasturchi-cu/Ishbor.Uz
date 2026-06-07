'use client'

import { useState } from 'react'
import { Send, Paperclip, Phone, Video, MoreVertical, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Message {
  id: string
  sender: string
  content: string
  timestamp: string
  isSent: boolean
  attachment?: { name: string; size: string }
}

interface Conversation {
  id: string
  name: string
  avatar: string
  lastMessage: string
  unread: number
  online: boolean
  messages: Message[]
}

const mockConversations: Conversation[] = [
  {
    id: '1',
    name: 'Alex Johnson',
    avatar: 'AJ',
    lastMessage: 'Great work on the design! Can you...',
    unread: 2,
    online: true,
    messages: [
      { id: '1', sender: 'You', content: 'Hi, I am interested in your design service', timestamp: '10:30 AM', isSent: true },
      { id: '2', sender: 'Alex', content: 'Hello! Yes, I can help with that. What do you need?', timestamp: '10:35 AM', isSent: false },
      { id: '3', sender: 'You', content: 'Need a professional web design', timestamp: '10:40 AM', isSent: true },
    ],
  },
  {
    id: '2',
    name: 'Sarah Designer',
    avatar: 'SD',
    lastMessage: 'When can you start?',
    unread: 0,
    online: false,
    messages: [
      { id: '1', sender: 'Sarah', content: 'Ready to start the project?', timestamp: 'Yesterday', isSent: false },
    ],
  },
]

export default function Messaging() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(mockConversations[0])
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const handleSendMessage = () => {
    if (!message.trim() || !selectedConversation) return

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'You',
      content: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSent: true,
    }

    setSelectedConversation(prev => prev ? { ...prev, messages: [...prev.messages, newMessage] } : null)
    setMessage('')
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground mb-4">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {mockConversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => setSelectedConversation(conv)}
              className={`w-full px-4 py-3 border-b border-border hover:bg-secondary/30 transition text-left ${
                selectedConversation?.id === conv.id ? 'bg-secondary' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    {conv.avatar}
                  </div>
                  {conv.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{conv.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                </div>
                {conv.unread > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                    {conv.unread}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  {selectedConversation.avatar}
                </div>
                {selectedConversation.online && <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full" />}
              </div>
              <div>
                <h2 className="font-bold text-foreground">{selectedConversation.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {selectedConversation.online ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="p-2"><Phone className="w-5 h-5" /></Button>
              <Button variant="ghost" size="sm" className="p-2"><Video className="w-5 h-5" /></Button>
              <Button variant="ghost" size="sm" className="p-2"><MoreVertical className="w-5 h-5" /></Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {selectedConversation.messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.isSent ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.isSent
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-secondary text-foreground rounded-bl-none'
                  }`}
                >
                  <p className="text-sm font-medium">{msg.content}</p>
                  <p className={`text-xs mt-1 ${msg.isSent ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {msg.timestamp}
                  </p>
                  {msg.attachment && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <Paperclip className="w-3 h-3" />
                      {msg.attachment.name} ({msg.attachment.size})
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="px-6 py-4 border-t border-border">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="p-2">
                <Paperclip className="w-5 h-5" />
              </Button>
              <Input
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim()}
                className="font-bold gap-2"
              >
                <Send className="w-4 h-4" />
                Send
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <p>Select a conversation to start messaging</p>
        </div>
      )}
    </div>
  )
}
