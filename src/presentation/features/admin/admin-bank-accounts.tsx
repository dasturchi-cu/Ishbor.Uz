'use client'

import { useCallback, useState } from 'react'
import { useApp } from '@/application/providers/app-provider'
import { Card } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Alert } from '@/presentation/components/ui/alert'
import { LoadingBlock } from '@/presentation/components/ui/loading-block'
import { api } from '@/infrastructure/api/client'
import type { ApiBankAccount } from '@/infrastructure/api/types'
import { useAuthedEffect } from '@/shared/lib/use-auth-ready'
import { captureLoadError } from '@/shared/lib/load-error'
import { VerifiedBadge } from '@/presentation/components/features/verified-badge'

type BankRow = ApiBankAccount & {
  profiles?: { full_name: string | null; email: string | null } | null
}

export function AdminBankAccounts() {
  const { t } = useApp()
  const [items, setItems] = useState<BankRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    api
      .adminListBankAccounts(false)
      .then((res) => setItems(res.items as BankRow[]))
      .catch((e) => setError(captureLoadError(e, { scope: 'admin' }, t)))
      .finally(() => setLoading(false))
  }, [t])

  useAuthedEffect(() => {
    load()
  }, [load])

  const verify = async (id: string) => {
    setActionId(id)
    try {
      await api.adminVerifyBankAccount(id)
      setItems((prev) => prev.filter((a) => a.id !== id))
    } catch {
      setError(t('error_required'))
    } finally {
      setActionId(null)
    }
  }

  if (loading) return <LoadingBlock />
  if (error) {
    return (
      <Alert variant="error">
        <div className="flex items-center justify-between gap-3">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={load}>
            {t('catalog_retry')}
          </Button>
        </div>
      </Alert>
    )
  }

  return (
    <Card className="p-6">
      <h2 className="mb-4 text-[15px] font-bold text-[var(--kwork-text)]">{t('admin_bank_accounts_title')}</h2>
      {items.length === 0 ? (
        <p className="text-[13px] text-[var(--kwork-text-muted)]">{t('admin_bank_accounts_empty')}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--kwork-border)] p-4 text-[13px]"
            >
              <div>
                <p className="font-semibold text-[var(--kwork-text)]">{a.bank_name}</p>
                <p className="text-[var(--kwork-text-muted)]">
                  {a.profiles?.full_name ?? a.account_holder} · {a.profiles?.email ?? '—'}
                </p>
                <p className="mt-1 text-[var(--kwork-text-sub)]">
                  {a.account_holder} · •••• {a.account_number.slice(-4)}
                  {a.mfo ? ` · MFO ${a.mfo}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {a.is_verified ? (
                  <VerifiedBadge />
                ) : (
                  <Button size="sm" variant="primary" loading={actionId === a.id} onClick={() => verify(a.id)}>
                    {t('admin_bank_verify')}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
