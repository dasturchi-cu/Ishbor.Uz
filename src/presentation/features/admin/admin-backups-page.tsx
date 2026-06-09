'use client'

import { useCallback, useState } from 'react'
import { Database, Plus } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { Card } from '@/presentation/components/ui/card'
import { Alert } from '@/presentation/components/ui/alert'
import { Button } from '@/presentation/components/ui/button'
import { LoadingBlock } from '@/presentation/components/ui/loading-block'
import { api } from '@/infrastructure/api/client'
import type { ApiBackupMetadata } from '@/infrastructure/api/types'
import type { TranslationKey } from '@/infrastructure/i18n'
import { AdminLayout } from '@/presentation/features/admin/admin-layout'
import { useAuthedEffect } from '@/shared/lib/use-auth-ready'
import { captureLoadError } from '@/shared/lib/load-error'
import { formatRelativeTime } from '@/shared/lib/format-relative-time'
import { toast } from '@/presentation/components/ui/toast'

const TYPE_KEYS: Record<string, TranslationKey> = {
  manual: 'admin_backup_type_manual',
  scheduled: 'admin_backup_type_scheduled',
  pre_migration: 'admin_backup_type_pre_migration',
}

function backupTypeLabel(type: string, t: (key: TranslationKey) => string) {
  const key = TYPE_KEYS[type]
  return key ? t(key) : type
}

export function AdminBackupsPage() {
  const { t, language } = useApp()
  const [rows, setRows] = useState<ApiBackupMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [recording, setRecording] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    api
      .adminBackups(50)
      .then(setRows)
      .catch((e) => setError(captureLoadError(e, { scope: 'admin' }, t)))
      .finally(() => setLoading(false))
  }, [t])

  useAuthedEffect(() => {
    load()
  }, [load])

  const recordCheckpoint = async () => {
    setRecording(true)
    try {
      const row = await api.adminRecordBackup({ backup_type: 'manual' })
      setRows((prev) => [row, ...prev])
      toast.success(t('admin_backups_record_done'))
    } catch (e) {
      setError(captureLoadError(e, { scope: 'admin' }, t))
    } finally {
      setRecording(false)
    }
  }

  return (
    <AdminLayout onRefresh={load} refreshing={loading && rows.length > 0}>
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}
      <Card className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--admin-text)]">
            <Database className="size-5" aria-hidden />
            {t('admin_backups_title')}
          </h2>
          <Button variant="outline" size="sm" loading={recording} onClick={() => void recordCheckpoint()}>
            <Plus className="mr-1.5 size-4" aria-hidden />
            {t('admin_backups_record')}
          </Button>
        </div>
        <p className="mb-4 text-[13px] text-[var(--admin-muted)]">
          {t('admin_backups_record_only_hint')}
        </p>
        {loading && rows.length === 0 ? (
          <LoadingBlock className="py-10" />
        ) : rows.length === 0 ? (
          <p className="text-sm text-[var(--admin-muted)]">{t('admin_backups_empty')}</p>
        ) : (
          <ul className="divide-y divide-[var(--admin-border)]">
            {rows.map((row) => (
              <li key={row.id} className="flex flex-wrap items-start justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-[var(--admin-text)]">
                    {backupTypeLabel(row.backup_type, t)}
                  </p>
                  {row.notes && (
                    <p className="mt-0.5 text-[12px] text-[var(--admin-muted)]">{row.notes}</p>
                  )}
                  <span className="mt-1 inline-block rounded bg-[var(--admin-bg)] px-1.5 py-0.5 text-[10px] uppercase text-[var(--admin-muted)]">
                    {t('admin_backup_status')}: {row.status}
                  </span>
                </div>
                <time className="shrink-0 text-[12px] text-[var(--admin-muted)]">
                  {row.created_at ? formatRelativeTime(row.created_at, language) : '—'}
                </time>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AdminLayout>
  )
}
