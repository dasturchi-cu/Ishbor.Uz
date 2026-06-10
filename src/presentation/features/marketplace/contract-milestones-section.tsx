'use client'

import { useCallback, useEffect, useState } from 'react'
import { useApp } from '@/application/providers/app-provider'
import { useDashboardRole } from '@/presentation/components/auth/role-guard'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { PaymentStatusBadge } from '@/presentation/components/features/payment-status-badge'
import { api } from '@/infrastructure/api/client'
import Link from 'next/link'
import type { ApiEscrowTransaction, ApiMilestone } from '@/infrastructure/api/types'
import { PATHS } from '@/domain/constants/routes'
import { formatPrice } from '@/shared/lib/format'
import { formatDate } from '@/shared/lib/format-date'
import { toast } from '@/presentation/components/ui/toast'
import { captureActionError } from '@/shared/lib/action-error'
import { Plus, Layers } from 'lucide-react'
import type { TranslationKey } from '@/infrastructure/i18n'
import { LoadErrorAlert } from '@/presentation/components/ui/load-error-alert'

const STATUS_LABEL: Record<string, TranslationKey> = {
  pending: 'milestone_status_pending',
  funded: 'milestone_status_funded',
  submitted: 'milestone_status_submitted',
  approved: 'milestone_status_approved',
  released: 'milestone_status_released',
  cancelled: 'milestone_status_cancelled',
}

function escrowForMilestone(milestoneId: string, txs: ApiEscrowTransaction[]): ApiEscrowTransaction | undefined {
  const related = txs.filter((tx) => tx.source_type === 'milestone' && tx.source_id === milestoneId)
  return related.find((tx) => tx.action === 'release') ?? related[related.length - 1]
}

interface ContractMilestonesSectionProps {
  contractId: string
  contractStatus: string
  escrowTransactions?: ApiEscrowTransaction[]
  onUpdated?: () => void
}

export function ContractMilestonesSection({
  contractId,
  contractStatus,
  escrowTransactions = [],
  onUpdated,
}: ContractMilestonesSectionProps) {
  const { t, language } = useApp()
  const role = useDashboardRole()
  const isClient = role === 'client'
  const [milestones, setMilestones] = useState<ApiMilestone[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<unknown>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    setLoadError(null)
    api
      .listContractMilestones(contractId)
      .then((rows) => {
        setMilestones(rows)
        setLoadError(null)
      })
      .catch((e) => {
        setMilestones([])
        setLoadError(e)
      })
      .finally(() => setLoading(false))
  }, [contractId])

  useEffect(() => {
    load()
  }, [load])

  const canManage = ['active', 'submitted', 'revision_requested', 'completed'].includes(contractStatus)

  const handleCreate = async () => {
    const parsed = Number(amount.replace(/\s/g, ''))
    if (!title.trim() || !parsed || parsed < 1000) {
      toast.error(t('milestone_form_invalid'))
      return
    }
    setBusyId('create')
    try {
      await api.createMilestone(contractId, {
        title: title.trim(),
        amount: parsed,
        sort_order: milestones.length,
      })
      setTitle('')
      setAmount('')
      setShowForm(false)
      toast.success(t('milestone_created'))
      load()
      onUpdated?.()
    } catch (e) {
      toast.error(captureActionError(e, { scope: 'contract_milestone' }, t))
    } finally {
      setBusyId(null)
    }
  }

  const handleStatus = async (milestone: ApiMilestone, status: string) => {
    setBusyId(milestone.id)
    try {
      if (status === 'released' && milestone.status === 'approved') {
        await api.updateMilestoneStatus(milestone.id, 'released')
      } else {
        await api.updateMilestoneStatus(milestone.id, status)
      }
      toast.success(t('milestone_updated'))
      load()
      onUpdated?.()
    } catch (e) {
      toast.error(captureActionError(e, { scope: 'contract_milestone' }, t))
    } finally {
      setBusyId(null)
    }
  }

  const actionFor = (m: ApiMilestone): { status: string; labelKey: TranslationKey } | null => {
    if (isClient && m.status === 'pending') return { status: 'funded', labelKey: 'milestone_action_fund' }
    if (!isClient && m.status === 'funded') return { status: 'submitted', labelKey: 'milestone_action_submit' }
    if (isClient && m.status === 'submitted') return { status: 'approved', labelKey: 'milestone_action_approve' }
    if (isClient && m.status === 'approved') return { status: 'released', labelKey: 'milestone_action_release' }
    return null
  }

  if (loading) {
    return <div className="h-24 animate-pulse rounded-xl bg-[var(--color-bg-muted)]" />
  }

  if (loadError) {
    return (
      <LoadErrorAlert error={loadError} scope="payments" onRetry={load} className="mb-4" />
    )
  }

  return (
    <section className="rounded-xl border border-[var(--ishbor-border)] bg-[var(--neutral-0)] p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[16px] font-bold text-[var(--ishbor-text)]">
          <Layers className="h-4 w-4 text-[var(--color-primary)]" />
          {t('milestone_section_title')}
        </h2>
        {isClient && canManage && (
          <Button variant="outline" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowForm((v) => !v)}>
            {t('milestone_add')}
          </Button>
        )}
      </div>

      {showForm && (
        <div className="mb-4 grid gap-3 rounded-lg border border-dashed border-[var(--ishbor-border)] p-3 sm:grid-cols-[1fr_140px_auto]">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('milestone_title_ph')} />
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={t('milestone_amount_ph')}
            inputMode="numeric"
          />
          <Button variant="primary" size="sm" loading={busyId === 'create'} onClick={() => void handleCreate()}>
            {t('confirm')}
          </Button>
        </div>
      )}

      {milestones.length === 0 ? (
        <p className="text-[13px] text-[var(--ishbor-text-muted)]">{t('milestone_empty')}</p>
      ) : (
        <ul className="space-y-3">
          {milestones.map((m) => {
            const action = actionFor(m)
            const statusKey = STATUS_LABEL[m.status] ?? 'milestone_status_pending'
            const escrowTx =
              (m.status === 'released' || m.payment_status === 'released')
                ? escrowForMilestone(m.id, escrowTransactions)
                : undefined
            return (
              <li
                key={m.id}
                className="flex flex-col gap-3 rounded-lg border border-[var(--ishbor-border)] p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--ishbor-text)]">{m.title}</p>
                  <p className="mt-0.5 text-[12px] text-[var(--ishbor-text-muted)]">
                    {formatPrice(m.amount)}
                    {m.due_date ? ` · ${formatDate(m.due_date, language)}` : ''}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[var(--color-primary-light)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-primary)]">
                      {t(statusKey)}
                    </span>
                    <PaymentStatusBadge status={m.payment_status} />
                  </div>
                  {escrowTx && (
                    <Link
                      href={`${PATHS.dashboardWallet}?tab=protected`}
                      className="mt-2 inline-flex text-[12px] font-medium text-[var(--color-primary)] hover:underline"
                    >
                      {t('milestone_escrow_link')} · {formatPrice(escrowTx.amount)}
                    </Link>
                  )}
                </div>
                {action && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="shrink-0"
                    loading={busyId === m.id}
                    onClick={() => void handleStatus(m, action.status)}
                  >
                    {t(action.labelKey)}
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
