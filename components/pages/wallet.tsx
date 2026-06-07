'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowUp, ArrowDown, Lock, Calendar, DollarSign, Plus, Send } from 'lucide-react'
import { mockTransactions } from '@/lib/mock-data'

export function WalletPage() {
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')

  // Mock wallet data
  const wallet = {
    balance: 8100000, // som
    escrowBalance: 2500000,
    totalEarnings: 14600000,
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Wallet</h1>
        <p className="text-muted-foreground">Manage your funds and transactions</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Available Balance */}
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <p className="text-sm text-muted-foreground mb-2">Available Balance</p>
          <p className="text-4xl font-bold text-foreground mb-4">{(wallet.balance / 1000000).toFixed(1)}M</p>
          <p className="text-xs text-muted-foreground mb-4">som</p>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 gap-2">
              <Plus className="h-4 w-4" /> Top Up
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => setShowWithdraw(!showWithdraw)}
            >
              <ArrowUp className="h-4 w-4" /> Withdraw
            </Button>
          </div>
        </Card>

        {/* Escrow Balance */}
        <Card className="p-6 border-l-4 border-l-yellow-500">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-sm text-muted-foreground">Escrow Balance</p>
              <p className="text-3xl font-bold text-foreground mt-2">{(wallet.escrowBalance / 1000000).toFixed(1)}M</p>
            </div>
            <Lock className="h-5 w-5 text-yellow-500" />
          </div>
          <p className="text-xs text-muted-foreground mt-4">Protected on active orders</p>
        </Card>

        {/* Total Earnings */}
        <Card className="p-6 border-l-4 border-l-green-500">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-sm text-muted-foreground">Total Earnings</p>
              <p className="text-3xl font-bold text-foreground mt-2">{(wallet.totalEarnings / 1000000).toFixed(1)}M</p>
            </div>
            <DollarSign className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-xs text-muted-foreground mt-4">All time earnings</p>
        </Card>
      </div>

      {/* Withdraw Form */}
      {showWithdraw && (
        <Card className="p-6 mb-8 bg-secondary">
          <h3 className="font-bold text-foreground mb-4">Withdraw Funds</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">Amount (som)</label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">Available: {(wallet.balance / 1000000).toFixed(1)}M som</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">Payment Method</label>
              <select className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground">
                <option>Click (+1% fee)</option>
                <option>Payme (+1.5% fee)</option>
                <option>Bank Card (+2% fee)</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1 gap-2">
                <Send className="h-4 w-4" /> Withdraw Now
              </Button>
              <Button variant="outline" onClick={() => setShowWithdraw(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Payment Methods */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-foreground mb-4">Payment Methods</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Click', icon: '🔵', status: 'Active' },
            { name: 'Payme', icon: '📱', status: 'Connected' },
            { name: 'Card', icon: '💳', status: 'Pending' },
          ].map((method) => (
            <Card
              key={method.name}
              className="p-4 cursor-pointer hover:shadow-md transition"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{method.icon}</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  method.status === 'Active'
                    ? 'bg-green-100 text-green-700'
                    : method.status === 'Connected'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {method.status}
                </span>
              </div>
              <p className="font-semibold text-foreground text-sm">{method.name}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">Transaction History</h2>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Description</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-muted-foreground">Type</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-muted-foreground">Amount</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {mockTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-border hover:bg-secondary transition">
                    <td className="px-6 py-4 text-sm text-foreground">
                      <div className="flex items-center gap-2">
                        {tx.type === 'income' && <ArrowDown className="h-4 w-4 text-green-500" />}
                        {tx.type === 'withdraw' && <ArrowUp className="h-4 w-4 text-red-500" />}
                        {tx.date}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{tx.description}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm px-2 py-1 rounded ${
                        tx.type === 'income'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {tx.type === 'income' ? 'Income' : 'Expense'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-right font-semibold text-sm ${
                      tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{(tx.amount / 1000000).toFixed(1)}M
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
