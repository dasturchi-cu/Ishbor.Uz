'use client'

import { useCallback, useEffect, useState } from 'react'
import { useApp } from '@/application/providers/app-provider'
import { api } from '@/infrastructure/api/client'
import type { ApiBankAccount } from '@/infrastructure/api/types'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { LoadingBlock } from '@/presentation/components/ui/loading-block'
import { toast } from '@/presentation/components/ui/toast'
import { VerifiedBadge } from '@/presentation/components/features/verified-badge'

export function BankAccountsSection() {
  const { t } = useApp()
  const [accounts, setAccounts] = useState<ApiBankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ bank_name: '', account_holder: '', account_number: '', mfo: '' })

  const load = useCallback(() => {
    setLoading(true)
    api
      .listBankAccounts()
      .then(setAccounts)
      .catch(() => setAccounts([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.createBankAccount({
        bank_name: form.bank_name,
        account_holder: form.account_holder,
        account_number: form.account_number,
        mfo: form.mfo || undefined,
      })
      toast.success(t('bank_saved'))
      setForm({ bank_name: '', account_holder: '', account_number: '', mfo: '' })
      load()
    } catch {
      toast.error(t('data_load_failed'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingBlock className="py-8" />

  return (
    <section className="surface-panel p-5">
      <h2 className="mb-4 text-[15px] font-bold text-[var(--kwork-text)]">{t('bank_accounts_title')}</h2>
      {accounts.length > 0 && (
        <ul className="mb-5 space-y-2">
          {accounts.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--r-md)] border border-[var(--kwork-border)] p-3 text-[13px]"
            >
              <div>
                <p className="font-semibold text-[var(--kwork-text)]">{a.bank_name}</p>
                <p className="text-[var(--kwork-text-muted)]">
                  {a.account_holder} · •••• {a.account_number.slice(-4)}
                </p>
              </div>
              {a.is_verified ? (
                <VerifiedBadge />
              ) : (
                <span className="text-[11px] text-[var(--warning-dark)]">{t('bank_accounts_pending')}</span>
              )}
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <Input
          placeholder={t('bank_name')}
          value={form.bank_name}
          onChange={(e) => setForm((f) => ({ ...f, bank_name: e.target.value }))}
          required
        />
        <Input
          placeholder={t('account_holder')}
          value={form.account_holder}
          onChange={(e) => setForm((f) => ({ ...f, account_holder: e.target.value }))}
          required
        />
        <Input
          placeholder={t('account_number')}
          value={form.account_number}
          onChange={(e) => setForm((f) => ({ ...f, account_number: e.target.value }))}
          required
        />
        <Input
          placeholder="MFO"
          value={form.mfo}
          onChange={(e) => setForm((f) => ({ ...f, mfo: e.target.value }))}
        />
        <Button type="submit" variant="primary" disabled={saving} className="sm:col-span-2">
          {t('bank_accounts_add')}
        </Button>
      </form>
    </section>
  )
}
