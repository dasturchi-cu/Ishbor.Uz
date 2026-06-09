'use client'

import { useState } from 'react'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { Textarea } from '@/presentation/components/ui/textarea'
import { toast } from '@/presentation/components/ui/toast'
import { api, ApiError } from '@/infrastructure/api/client'

type ReportCategory = 'scam' | 'spam' | 'fake_account' | 'abuse'
type ReportTargetType = 'user' | 'service' | 'project' | 'review' | 'message'

interface ReportModalProps {
  targetType: ReportTargetType
  targetId: string
  onClose: () => void
}

const CATEGORIES: ReportCategory[] = ['scam', 'spam', 'fake_account', 'abuse']

export function ReportModal({ targetType, targetId, onClose }: ReportModalProps) {
  const { t } = useApp()
  const [category, setCategory] = useState<ReportCategory>('abuse')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const categoryLabel = (c: ReportCategory) => {
    const map: Record<ReportCategory, string> = {
      scam: t('report_category_scam'),
      spam: t('report_category_spam'),
      fake_account: t('report_category_fake'),
      abuse: t('report_category_abuse'),
    }
    return map[c]
  }

  const submit = async () => {
    if (description.trim().length < 10) {
      toast.error(t('report_desc_min'))
      return
    }
    setLoading(true)
    try {
      await api.createReport({
        target_type: targetType,
        target_id: targetId,
        category,
        description: description.trim(),
      })
      toast.success(t('report_submitted'))
      onClose()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('error_required'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border border-[var(--kwork-border)] bg-[var(--neutral-0)] p-5 shadow-[var(--shadow-lg)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h2 className="text-[18px] font-bold text-[var(--kwork-text)]">{t('report_title')}</h2>
        <p className="mt-1 text-[13px] text-[var(--kwork-text-muted)]">{t('report_desc_hint')}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={
                category === c
                  ? 'rounded-full border border-[var(--color-primary)] bg-[var(--color-primary-light)] px-3 py-1.5 text-[12px] font-medium text-[var(--color-primary)]'
                  : 'rounded-full border border-[var(--kwork-border)] px-3 py-1.5 text-[12px] text-[var(--kwork-text-muted)]'
              }
            >
              {categoryLabel(c)}
            </button>
          ))}
        </div>

        <Textarea
          className="mt-4"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('report_desc_ph')}
        />

        <div className="mt-5 flex gap-2">
          <Button variant="outline" fullWidth onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button variant="primary" fullWidth loading={loading} onClick={submit}>
            {t('report_submit')}
          </Button>
        </div>
      </div>
    </div>
  )
}
