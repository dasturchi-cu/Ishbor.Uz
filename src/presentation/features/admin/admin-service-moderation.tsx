'use client'

import { useCallback, useEffect, useState } from 'react'
import { useApp } from '@/application/providers/app-provider'
import { api } from '@/infrastructure/api/client'
import type { ApiServiceModerationItem } from '@/infrastructure/api/types'
import { Button } from '@/presentation/components/ui/button'
import { Card } from '@/presentation/components/ui/card'
import { LoadingBlock } from '@/presentation/components/ui/loading-block'
export function AdminServiceModeration() {
  const { t } = useApp()
  const [items, setItems] = useState<ApiServiceModerationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    api
      .adminServiceModerationQueue()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const moderate = async (id: string, status: 'approved' | 'rejected') => {
    setActionId(id)
    try {
      await api.adminModerateService(id, status)
      setItems((prev) => prev.filter((i) => i.id !== id))
    } finally {
      setActionId(null)
    }
  }

  if (loading) return <LoadingBlock />

  if (items.length === 0) {
    return <p className="text-[13px] text-[var(--kwork-text-muted)]">{t('admin_audit_empty')}</p>
  }

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-[15px] font-bold">{t('admin_service_moderation')}</h3>
      <ul className="space-y-3">
        {items.map((svc) => (
          <li
            key={svc.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--r-md)] border border-[var(--kwork-border)] p-3"
          >
            <div>
              <p className="font-semibold text-[var(--kwork-text)]">{svc.title}</p>
              <p className="text-[12px] text-[var(--kwork-text-muted)]">
                {svc.profiles?.full_name ?? svc.freelancer_id}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="primary"
                disabled={actionId === svc.id}
                onClick={() => moderate(svc.id, 'approved')}
              >
                {t('admin_moderate_approve')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={actionId === svc.id}
                onClick={() => moderate(svc.id, 'rejected')}
              >
                {t('admin_moderate_reject')}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
