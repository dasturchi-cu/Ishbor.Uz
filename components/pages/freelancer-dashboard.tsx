'use client'

import React from 'react'
import { useApp } from '@/components/providers/app-provider'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { MessageSquare, Star, Clock, CheckCircle, TrendingUp, Send } from 'lucide-react'
import { mockOrders, mockMessages, mockTransactions } from '@/lib/mock-data'

const earningsData = [
  { month: 'Jan', earnings: 1200000 },
  { month: 'Feb', earnings: 1900000 },
  { month: 'Mar', earnings: 1600000 },
  { month: 'Apr', earnings: 2800000 },
  { month: 'May', earnings: 3200000 },
  { month: 'Jun', earnings: 3800000 },
]

export function FreelancerDashboard() {
  const { setCurrentPage } = useApp()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, Alisher! Here&apos;s your performance overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            label: 'Total Earnings',
            value: '14.6M',
            unit: 'som',
            icon: TrendingUp,
            color: 'from-primary to-blue-500',
          },
          {
            label: 'Active Orders',
            value: '2',
            unit: 'ongoing',
            icon: CheckCircle,
            color: 'from-green-500 to-emerald-500',
          },
          {
            label: 'Completed',
            value: '485',
            unit: 'projects',
            icon: CheckCircle,
            color: 'from-purple-500 to-pink-500',
          },
          {
            label: 'Rating',
            value: '4.9',
            unit: 'stars',
            icon: Star,
            color: 'from-accent to-orange-500',
          },
        ].map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Card key={idx} className="p-6 border-l-4 border-l-primary">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-semibold">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.unit}</p>
                </div>
                <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Earnings Chart */}
        <Card className="lg:col-span-2 p-6">
          <h2 className="text-lg font-bold text-foreground mb-6">6-Month Earnings</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={earningsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                labelStyle={{ color: 'var(--foreground)' }}
              />
              <Line
                type="monotone"
                dataKey="earnings"
                stroke="var(--primary)"
                strokeWidth={3}
                dot={{ fill: 'var(--primary)', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Quick Stats */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-foreground mb-6">Quick Stats</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Response Rate</span>
                <span className="font-bold text-foreground">98%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-primary rounded-full h-2 w-[98%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Profile Visits</span>
                <span className="font-bold text-foreground">2.4K</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-accent rounded-full h-2 w-[85%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Average Rating</span>
                <span className="font-bold text-foreground">4.9★</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-green-500 rounded-full h-2 w-[98%]" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Active Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Active Orders</h2>
          <div className="space-y-4">
            {mockOrders.map((order) => (
              <div key={order.id} className="flex items-start justify-between p-4 bg-secondary rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{order.title}</h3>
                  <p className="text-sm text-muted-foreground">{order.clientName}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-xs">
                      <Clock className="h-4 w-4 text-accent" />
                      <span>Deadline: {order.deadline}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">{(order.price / 1000000).toFixed(1)}M</p>
                  <span className="text-xs bg-green-500/20 text-green-700 px-2 py-1 rounded">Active</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Messages */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Recent Messages</h2>
          <div className="space-y-3">
            {mockMessages.slice(0, 3).map((msg) => (
              <div
                key={msg.id}
                className="flex items-start gap-3 pb-3 border-b border-border last:border-b-0 cursor-pointer hover:bg-secondary p-2 rounded transition"
                onClick={() => setCurrentPage('messages')}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground">{msg.senderName}</p>
                  <p className="text-sm text-muted-foreground truncate">{msg.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">{msg.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            className="w-full mt-4 gap-2"
            onClick={() => setCurrentPage('messages')}
          >
            <MessageSquare className="h-4 w-4" /> View All Messages
          </Button>
        </Card>
      </div>

      {/* Telegram Bot Banner */}
      <Card className="p-6 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-200 dark:border-blue-900">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-foreground mb-1">Connect Telegram Bot</h3>
            <p className="text-sm text-muted-foreground">Get instant notifications for new orders and messages</p>
          </div>
          <Button className="gap-2">
            <Send className="h-4 w-4" /> Connect
          </Button>
        </div>
      </Card>
    </div>
  )
}
