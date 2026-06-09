'use client'

import { useCallback, useEffect, useState } from 'react'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { Textarea } from '@/presentation/components/ui/textarea'
import { api } from '@/infrastructure/api/client'
import type { ApiDispute, ApiDisputeMessage } from '@/infrastructure/api/types'
import { Alert } from '@/presentation/components/ui/alert'
import { Scale } from 'lucide-react'

export function DisputePage({ disputeId }: { disputeId: string }) {
  const { t } = useApp()
  const [dispute, setDispute] = useState<ApiDispute | null>(null)
  const [messages, setMessages] = useState<ApiDisputeMessage[]>([])
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    Promise.all([api.getDispute(disputeId), api.listDisputeMessages(disputeId)])
      .then(([d, m]) => {
        setDispute(d)
        setMessages(m)
      })
      .finally(() => setLoading(false))
  }, [disputeId])

  useEffect(() => {
    load()
  }, [load])

  const sendReply = async () => {
    if (!reply.trim()) return
    setBusy(true)
    try {
      await api.postDisputeMessage(disputeId, reply)
      setReply('')
      load()
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <p className="p-6 text-muted-foreground">{t('loading_data')}</p>
  if (!dispute) return <Alert variant="error">{t('dispute_not_found')}</Alert>

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Scale className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">{t('dispute')}</h1>
        <span className="ml-auto rounded-full bg-muted px-3 py-1 text-sm capitalize">{dispute.status}</span>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">{t('dispute_reason')}</p>
        <p className="mt-1">{dispute.reason}</p>
      </div>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {messages.map((m) => (
          <div key={m.id} className="rounded-lg border bg-muted/30 p-3 text-sm">
            <p>{m.content}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder={t('type_message')} rows={2} />
        <Button onClick={sendReply} disabled={busy}>{t('send_message')}</Button>
      </div>
    </div>
  )
}
