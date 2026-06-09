'use client'

import { useState } from 'react'
import { useApp } from '@/application/providers/app-provider'
import { Card } from '@/presentation/components/ui/card'
import { Alert } from '@/presentation/components/ui/alert'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Textarea } from '@/presentation/components/ui/textarea'
import { ConfirmModal } from '@/presentation/components/dashboard/confirm-modal'
import { api } from '@/infrastructure/api/client'
import { AdminLayout } from '@/presentation/features/admin/admin-layout'

type BroadcastTarget = 'all' | 'freelancers' | 'clients'

export function AdminBroadcastPage() {
  const { t } = useApp()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [href, setHref] = useState('')
  const [target, setTarget] = useState<BroadcastTarget>('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const send = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const result = await api.adminBroadcastNotification({
        title: title.trim(),
        body: body.trim(),
        href: href.trim() || undefined,
        target,
      })
      setSuccess(t('admin_broadcast_sent').replace('{count}', String(result.sent)))
      setTitle('')
      setBody('')
      setHref('')
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error_required'))
    } finally {
      setLoading(false)
      setConfirmOpen(false)
    }
  }

  return (
    <AdminLayout>
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}
      {success && <Alert variant="success" className="mb-4">{success}</Alert>}

      <Card className="max-w-2xl p-6">
        <h2 className="mb-1 text-lg font-bold text-[var(--admin-text)]">{t('admin_broadcast_title')}</h2>
        <p className="mb-5 text-sm text-[var(--admin-muted)]">{t('admin_broadcast_desc')}</p>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--admin-text)]">{t('admin_broadcast_field_title')}</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--admin-text)]">{t('description')}</label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} maxLength={500} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--admin-text)]">{t('admin_broadcast_href')}</label>
            <Input value={href} onChange={(e) => setHref(e.target.value)} placeholder="/dashboard" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--admin-text)]">{t('admin_broadcast_target')}</label>
            <select
              className="select-auth w-full rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm"
              value={target}
              onChange={(e) => setTarget(e.target.value as BroadcastTarget)}
            >
              <option value="all">{t('admin_broadcast_target_all')}</option>
              <option value="freelancers">{t('admin_broadcast_target_freelancers')}</option>
              <option value="clients">{t('admin_broadcast_target_clients')}</option>
            </select>
          </div>
          <Button
            variant="primary"
            loading={loading}
            disabled={!title.trim() || !body.trim()}
            onClick={() => setConfirmOpen(true)}
          >
            {t('admin_broadcast_send')}
          </Button>
        </div>
      </Card>

      <ConfirmModal
        open={confirmOpen}
        title={t('admin_broadcast_confirm')}
        description={t('admin_broadcast_confirm_desc')}
        danger
        confirmLabel={t('admin_broadcast_send')}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void send()}
      />
    </AdminLayout>
  )
}
