'use client'

import { useCallback, useEffect, useState } from 'react'
import { useProtectedLoader } from '@/shared/lib/use-protected-loader'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { useDashboardRole } from '@/presentation/components/auth/role-guard'
import { Alert } from '@/presentation/components/ui/alert'
import { Button } from '@/presentation/components/ui/button'
import { Textarea } from '@/presentation/components/ui/textarea'
import { PaymentStatusBadge } from '@/presentation/components/features/payment-status-badge'
import { ContractStatusBadge } from '@/presentation/components/features/contract-status-badge'
import { api } from '@/infrastructure/api/client'
import type { ApiContract, ApiEscrowTransaction, ApiProjectReview } from '@/infrastructure/api/types'
import { ContractReviewModal } from '@/presentation/components/features/contract-review-modal'
import { PATHS, dashboardCallRoom, dashboardDispute } from '@/domain/constants/routes'
import { startVideoCall } from '@/shared/lib/start-video-call'
import { formatPrice } from '@/shared/lib/format'
import { formatDate } from '@/shared/lib/format-date'
import { toast } from '@/presentation/components/ui/toast'
import { captureActionError } from '@/shared/lib/action-error'
import { FileText, Shield, MessageSquare, Phone } from 'lucide-react'
import { ContractMilestonesSection } from '@/presentation/features/marketplace/contract-milestones-section'

const CLIENT_ACTIONS: Record<string, string> = {
  pending_payment: 'fund_escrow',
  submitted: 'approve_work',
}
const FREELANCER_ACTIONS: Record<string, string> = {
  active: 'submit_work',
  revision_requested: 'resubmit_work',
}

export function ContractDetailPage({ contractId }: { contractId: string }) {
  const { t, language, userId } = useApp()
  const role = useDashboardRole()
  const router = useRouter()
  const [contract, setContract] = useState<ApiContract | null>(null)
  const [escrow, setEscrow] = useState<ApiEscrowTransaction[]>([])
  const [busy, setBusy] = useState(false)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [reviews, setReviews] = useState<ApiProjectReview[]>([])
  const [showReview, setShowReview] = useState(false)
  const [callStarting, setCallStarting] = useState(false)

  const { data, loading, reload } = useProtectedLoader(async () => {
    const [c, e] = await Promise.all([
      api.getContract(contractId).catch(() => null),
      api.listContractEscrow(contractId).catch(() => [] as ApiEscrowTransaction[]),
    ])
    let rev: ApiProjectReview[] = []
    if (c?.status === 'completed') {
      rev = await api.listProjectReviews(contractId).catch(() => [] as ApiProjectReview[])
    }
    return { contract: c, escrow: e, reviews: rev }
  }, [contractId])

  useEffect(() => {
    if (!data) return
    setContract(data.contract)
    setEscrow(data.escrow)
    setReviews(data.reviews)
  }, [data])

  const load = useCallback(() => {
    void reload()
  }, [reload])

  const isClient = role === 'client'
  const calleeId =
    contract && userId ? (isClient ? contract.freelancer_id : contract.client_id) : null
  const status = contract?.status ?? ''
  const actionKey = isClient ? CLIENT_ACTIONS[status] : FREELANCER_ACTIONS[status]
  const myReview = reviews.find((r) => r.reviewer_id === userId)

  const handleAction = async () => {
    if (!contract || !actionKey) return
    setBusy(true)
    setError('')
    try {
      if (actionKey === 'fund_escrow') {
        await api.fundContract(contract.id)
        toast.success(t('escrow_funded'))
      } else if (actionKey === 'submit_work' || actionKey === 'resubmit_work') {
        await api.updateContractStatus(contract.id, 'submitted', notes || undefined)
        toast.success(t('work_submitted'))
      } else if (actionKey === 'approve_work') {
        await api.updateContractStatus(contract.id, 'completed')
        toast.success(t('project_completed'))
      }
      load()
    } catch (e) {
      setError(captureActionError(e, { scope: 'contract' }, t))
    } finally {
      setBusy(false)
    }
  }

  const handleVideoCall = async () => {
    if (!contract || !calleeId || callStarting) return
    setCallStarting(true)
    try {
      const session = await startVideoCall({
        calleeId,
        contractId: contract.id,
      })
      router.push(dashboardCallRoom(session.id))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('call_start_failed'))
    } finally {
      setCallStarting(false)
    }
  }

  const handleRevision = async () => {
    if (!contract) return
    setBusy(true)
    try {
      await api.updateContractStatus(contract.id, 'revision_requested', notes || undefined)
      toast.success(t('marketplace_revision_toast'))
      load()
    } catch (e) {
      setError(captureActionError(e, { scope: 'contract' }, t))
    } finally {
      setBusy(false)
    }
  }

  const handleDispute = async () => {
    if (!contract || !notes.trim()) return
    setBusy(true)
    try {
      const dispute = await api.openDispute(contract.id, notes)
      router.push(dashboardDispute(dispute.id))
    } catch (e) {
      setError(captureActionError(e, { scope: 'contract' }, t))
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <p className="text-muted-foreground p-6">{t('loading_data')}</p>
  }

  if (!contract) {
    return <Alert variant="error">{t('contract_not_found')}</Alert>
  }

  const otherName = isClient
    ? contract.freelancer_profile?.full_name ?? t('col_freelancer')
    : contract.client_profile?.full_name ?? t('role_client_label')

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{t('contract')}</p>
          <h1 className="text-2xl font-bold">{contract.title}</h1>
          <p className="text-muted-foreground mt-1">
            {otherName} · {formatPrice(contract.amount)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PaymentStatusBadge status={contract.payment_status} />
          <ContractStatusBadge status={contract.status} />
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 md:col-span-2 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t('contract_details')}
          </h2>
          {contract.deadline && (
            <p className="text-sm">
              <span className="text-muted-foreground">{t('project_deadline')}: </span>
              {formatDate(contract.deadline, language)}
            </p>
          )}
          {contract.delivery_notes && (
            <p className="text-sm whitespace-pre-wrap">{contract.delivery_notes}</p>
          )}
          {(status === 'active' || status === 'revision_requested' || status === 'submitted') && (
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('delivery_notes_placeholder')}
              rows={4}
            />
          )}
          <div className="flex flex-wrap gap-2">
            {actionKey && (
              <Button onClick={handleAction} disabled={busy}>
                {t(actionKey as never)}
              </Button>
            )}
            {isClient && status === 'submitted' && (
              <Button variant="outline" onClick={handleRevision} disabled={busy}>
                {t('request_revision')}
              </Button>
            )}
            {isClient && ['active', 'submitted', 'revision_requested'].includes(status) && (
              <Button variant="destructive" onClick={handleDispute} disabled={busy || notes.trim().length < 10}>
                {t('open_dispute')}
              </Button>
            )}
            {status === 'completed' && !myReview && (
              <Button variant="outline" onClick={() => setShowReview(true)}>
                {t('leave_review')}
              </Button>
            )}
          </div>
          {myReview && (
            <p className="text-[13px] text-[var(--kwork-text-muted)]">
              {t('review_submitted')} · {myReview.rating}/5
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {t('escrow')}
            </h3>
            <p className="text-2xl font-bold">{formatPrice(contract.amount)}</p>
            <Link href={PATHS.dashboardEscrow} className="text-sm text-primary hover:underline">
              {t('view_escrow_dashboard')}
            </Link>
          </div>
          <div className="rounded-xl border bg-card p-4 flex flex-col gap-2">
            <Link
              href={`${PATHS.dashboardMessages}?contract=${contract.id}`}
              className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {t('messages')}
            </Link>
            <Button
              variant="outline"
              className="w-full justify-center"
              loading={callStarting}
              disabled={!calleeId}
              onClick={() => void handleVideoCall()}
            >
              <Phone className="h-4 w-4 mr-2" aria-hidden />
              {callStarting ? t('call_starting') : t('video_call')}
            </Button>
          </div>
        </div>
      </div>

      <ContractMilestonesSection
        contractId={contract.id}
        contractStatus={status}
        escrowTransactions={escrow}
        onUpdated={() => void reload()}
      />

      {escrow.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold mb-3">{t('escrow_history')}</h2>
          <ul className="space-y-2 text-sm">
            {escrow.map((tx) => (
              <li key={tx.id} className="flex justify-between border-b pb-2 last:border-0">
                <span className="capitalize">{tx.action}</span>
                <span>{formatPrice(tx.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showReview && contract && (
        <ContractReviewModal
          contractId={contract.id}
          contractTitle={contract.title}
          onClose={() => setShowReview(false)}
          onSubmitted={() => {
            void reload()
          }}
        />
      )}
    </div>
  )
}
