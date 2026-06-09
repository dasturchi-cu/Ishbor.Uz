'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { Textarea } from '@/presentation/components/ui/textarea'
import { api } from '@/infrastructure/api/client'
import type { ApiVerification } from '@/infrastructure/api/types'
import { formatRelativeTime } from '@/shared/lib/format-relative-time'
import { PATHS } from '@/domain/constants/routes'
import { isAllowedExternalUrl } from '@/shared/lib/safe-url'
import { ExternalLink, ShieldCheck } from 'lucide-react'
import type { TranslationKey } from '@/infrastructure/i18n'

const VERIFICATION_TYPE_KEYS: Record<string, TranslationKey> = {
  employer: 'verification_type_employer',
  freelancer: 'verification_type_freelancer',
  identity: 'verification_type_identity',
  company: 'verification_type_company',
}

interface AdminVerificationQueueProps {
  items: ApiVerification[]
  onReviewed: (id: string) => void
}

export function AdminVerificationQueue({ items, onReviewed }: AdminVerificationQueueProps) {
  const { t, language } = useApp()
  const [actionId, setActionId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [approve, setApprove] = useState(true)
  const [notes, setNotes] = useState('')

  const pending = items.find((v) => v.id === confirmId)

  const submitReview = async () => {
    if (!confirmId) return
    setActionId(confirmId)
    try {
      await api.adminReviewVerification(confirmId, approve ? 'approved' : 'rejected', notes.trim() || undefined)
      onReviewed(confirmId)
      setConfirmId(null)
      setNotes('')
    } finally {
      setActionId(null)
    }
  }

  if (items.length === 0) {
    return <p className="text-[13px] text-[var(--ishbor-text-muted)]">{t('admin_verifications_empty')}</p>
  }

  return (
    <>
      <div className="space-y-3">
        {items.map((v) => (
          <div key={v.id} className="rounded-lg border border-[var(--ishbor-border)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[14px] font-semibold text-[var(--ishbor-text)]">
                  <ShieldCheck className="h-4 w-4 text-[var(--color-primary)]" />
                  {t(VERIFICATION_TYPE_KEYS[v.verification_type] ?? 'verification_type_identity')}
                </p>
                <p className="mt-1 text-[12px] text-[var(--ishbor-text-muted)]">
                  {t('admin_verification_user')}: {v.user_id.slice(0, 8)}…
                  {v.created_at && ` · ${formatRelativeTime(v.created_at, language)}`}
                </p>
                {v.notes && <p className="mt-2 text-[13px] text-[var(--ishbor-text-sub)]">{v.notes}</p>}
                {v.document_urls && v.document_urls.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {v.document_urls.filter(isAllowedExternalUrl).map((url) => (
                      <li key={url}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--color-primary)] hover:underline"
                        >
                          {t('admin_verification_document')}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Link
                  href={`${PATHS.admin}/users`}
                  className="rounded-lg border border-[var(--ishbor-border)] px-3 py-1.5 text-[12px] font-medium hover:bg-[var(--neutral-50)]"
                >
                  {t('admin_view_user')}
                </Link>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setConfirmId(v.id)
                    setApprove(true)
                    setNotes('')
                  }}
                >
                  {t('admin_verify_approve')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setConfirmId(v.id)
                    setApprove(false)
                    setNotes('')
                  }}
                >
                  {t('admin_verify_reject')}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--ishbor-border)] bg-[var(--neutral-0)] p-5 shadow-lg">
            <h3 className="text-[16px] font-bold">
              {approve ? t('admin_verify_confirm_approve') : t('admin_verify_confirm_reject')}
            </h3>
            <p className="mt-2 text-[13px] text-[var(--ishbor-text-muted)]">
              {t(VERIFICATION_TYPE_KEYS[pending.verification_type] ?? 'verification_type_identity')} ·{' '}
              {pending.user_id.slice(0, 8)}…
            </p>
            <Textarea
              className="mt-4"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('admin_verification_notes_ph')}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setConfirmId(null)}>
                {t('cancel')}
              </Button>
              <Button
                variant={approve ? 'primary' : 'destructive'}
                size="sm"
                loading={actionId === pending.id}
                onClick={() => void submitReview()}
              >
                {t('confirm')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
