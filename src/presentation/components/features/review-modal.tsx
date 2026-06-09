'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { Textarea } from '@/presentation/components/ui/textarea'
import { RatingStars } from '@/presentation/components/ui/rating-stars'
import { api } from '@/infrastructure/api/client'
import { toast } from '@/presentation/components/ui/toast'
import { useFocusTrap } from '@/shared/lib/use-focus-trap'

interface ReviewModalProps {
  orderId: string
  serviceTitle?: string
  existingReview?: { id: string; rating: number; comment?: string | null }
  onClose: () => void
  onSubmitted?: () => void
}

export function ReviewModal({ orderId, serviceTitle, existingReview, onClose, onSubmitted }: ReviewModalProps) {
  const { t } = useApp()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [rating, setRating] = useState(existingReview?.rating ?? 5)
  const [comment, setComment] = useState(existingReview?.comment ?? '')
  const [loading, setLoading] = useState(false)

  useFocusTrap(true, dialogRef)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = async () => {
    if (rating < 1) return
    setLoading(true)
    try {
      if (existingReview) {
        await api.updateReview(existingReview.id, {
          rating,
          comment: comment.trim() || undefined,
        })
        toast.success(t('review_updated'))
      } else {
        await api.createReview(orderId, rating, comment.trim() || undefined)
        toast.success(t('review_submitted'))
      }
      onSubmitted?.()
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('error_required'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
        className="w-full max-w-[420px] rounded-[var(--r-card)] border border-[var(--ishbor-border)] bg-[var(--color-bg)] p-5 shadow-[var(--shadow-lg)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="review-modal-title" className="text-[18px] font-bold text-[var(--ishbor-text)]">
              {existingReview ? t('review_edit') : t('write_review')}
            </h2>
            {serviceTitle && (
              <p className="mt-1 text-[13px] text-[var(--ishbor-text-muted)]">{serviceTitle}</p>
            )}
          </div>
          <button type="button" onClick={onClose} className="text-[var(--ishbor-text-muted)] hover:text-[var(--ishbor-text)]" aria-label={t('close')}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="mb-2 text-[13px] font-medium text-[var(--ishbor-text)]">{t('your_rating')}</p>
          <RatingStars rating={rating} size="lg" interactive onChange={setRating} />
        </div>

        <Textarea
          label={t('review_comment_label')}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('review_placeholder')}
          rows={4}
        />

        <div className="mt-5 flex gap-2">
          <Button variant="outline" fullWidth onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button variant="primary" fullWidth loading={loading} onClick={submit}>
            {t('review_submit')}
          </Button>
        </div>
      </div>
    </div>
  )
}
