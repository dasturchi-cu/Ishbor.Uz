'use client'

import { useCallback, useEffect, useState } from 'react'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { Textarea } from '@/presentation/components/ui/textarea'
import { api } from '@/infrastructure/api/client'
import type { ApiDispute, ApiDisputeMessage } from '@/infrastructure/api/types'
import { Alert } from '@/presentation/components/ui/alert'
import { Scale } from 'lucide-react'
import { useProtectedLoader } from '@/shared/lib/use-protected-loader'
import Link from 'next/link'
import type { TranslationKey } from '@/infrastructure/i18n'
import { dashboardOrderPath } from '@/domain/constants/routes'

const DISPUTE_STATUS_KEYS: Record<string, TranslationKey> = {
  open: 'dispute_status_open',
  responded: 'dispute_status_responded',
  under_review: 'dispute_status_under_review',
  resolved_client: 'dispute_status_resolved_client',
  resolved_freelancer: 'dispute_status_resolved_freelancer',
  closed: 'dispute_status_closed',
}

export function DisputePage({ disputeId }: { disputeId: string }) {
  const { t } = useApp()
  const [dispute, setDispute] = useState<ApiDispute | null>(null)
  const [messages, setMessages] = useState<ApiDisputeMessage[]>([])
  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState(false)

  const { data, loading, reload } = useProtectedLoader(
    () =>
      Promise.all([api.getDispute(disputeId), api.listDisputeMessages(disputeId)]).then(
        ([d, m]) => ({ dispute: d, messages: m })
      ),
    [disputeId]
  )

  useEffect(() => {
    if (!data) return
    setDispute(data.dispute)
    setMessages(data.messages)
  }, [data])

  const load = useCallback(() => {
    void reload()
  }, [reload])

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
        <span className="ml-auto rounded-full bg-muted px-3 py-1 text-sm">
          {DISPUTE_STATUS_KEYS[dispute.status] ? t(DISPUTE_STATUS_KEYS[dispute.status]) : dispute.status}
        </span>
      </div>
      {dispute.order_id && (
        <Link
          href={dashboardOrderPath(dispute.order_id)}
          className="text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          {t('nav_orders')} →
        </Link>
      )}
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
