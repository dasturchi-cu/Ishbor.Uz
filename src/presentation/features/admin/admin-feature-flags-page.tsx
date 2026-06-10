'use client'

import { useCallback, useState } from 'react'
import { useApp } from '@/application/providers/app-provider'
import { Card } from '@/presentation/components/ui/card'
import { Alert } from '@/presentation/components/ui/alert'
import { Button } from '@/presentation/components/ui/button'
import { LoadingBlock } from '@/presentation/components/ui/loading-block'
import { api } from '@/infrastructure/api/client'
import type { ApiFeatureFlag } from '@/infrastructure/api/types'
import { AdminLayout } from '@/presentation/features/admin/admin-layout'
import { useAuthedEffect } from '@/shared/lib/use-auth-ready'
import { captureLoadError } from '@/shared/lib/load-error'

export function AdminFeatureFlagsPage() {
  const { t } = useApp()
  const [flags, setFlags] = useState<ApiFeatureFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionKey, setActionKey] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    api
      .adminFeatureFlags()
      .then(setFlags)
      .catch((e) => setError(captureLoadError(e, { scope: 'admin' }, t)))
      .finally(() => setLoading(false))
  }, [t])

  useAuthedEffect(() => {
    load()
  }, [load])

  const toggle = async (flag: ApiFeatureFlag) => {
    setActionKey(flag.key)
    try {
      const updated = await api.adminUpdateFeatureFlag(flag.key, { enabled: !flag.enabled })
      setFlags((prev) => prev.map((row) => (row.key === flag.key ? { ...row, ...updated } : row)))
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error_required'))
    } finally {
      setActionKey(null)
    }
  }

  const setRollout = async (flag: ApiFeatureFlag, rollout_percent: number) => {
    setActionKey(flag.key)
    try {
      const updated = await api.adminUpdateFeatureFlag(flag.key, { rollout_percent })
      setFlags((prev) => prev.map((row) => (row.key === flag.key ? { ...row, ...updated } : row)))
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error_required'))
    } finally {
      setActionKey(null)
    }
  }

  return (
    <AdminLayout onRefresh={load} refreshing={loading && flags.length > 0}>
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-bold text-[var(--admin-text)]">{t('admin_feature_flags_title')}</h2>
        {loading && flags.length === 0 ? (
          <LoadingBlock className="py-10" />
        ) : (
          <div className="space-y-3">
            {flags.map((flag) => (
              <div
                key={flag.key}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--admin-border)] px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-[var(--admin-text)]">{flag.key}</p>
                  {flag.description && (
                    <p className="text-[12px] text-[var(--admin-muted)]">{flag.description}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="w-16 rounded border border-[var(--admin-border)] px-2 py-1 text-sm"
                    value={flag.rollout_percent}
                    onChange={(e) => {
                      const value = Number(e.target.value)
                      if (!Number.isNaN(value)) {
                        setFlags((prev) =>
                          prev.map((row) => (row.key === flag.key ? { ...row, rollout_percent: value } : row))
                        )
                      }
                    }}
                    onBlur={(e) => void setRollout(flag, Number(e.target.value))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur()
                      }
                    }}
                    aria-label={`${flag.key} rollout`}
                  />
                  <Button
                    variant={flag.enabled ? 'primary' : 'outline'}
                    size="sm"
                    loading={actionKey === flag.key}
                    onClick={() => void toggle(flag)}
                  >
                    {flag.enabled ? t('admin_feature_flag_on') : t('admin_feature_flag_off')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </AdminLayout>
  )
}
