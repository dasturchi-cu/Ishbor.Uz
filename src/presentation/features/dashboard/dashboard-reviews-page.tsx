'use client'

import { useState } from 'react'
import { Button } from '@/presentation/components/ui/button'
import { Textarea } from '@/presentation/components/ui/textarea'
import { toast } from '@/presentation/components/ui/toast'
import { useApp } from '@/application/providers/app-provider'
import { RatingStars } from '@/presentation/components/ui/rating-stars'
import { Avatar } from '@/presentation/components/ui/avatar'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { api } from '@/infrastructure/api/client'
import type { ApiReview } from '@/infrastructure/api/types'
import { cn } from '@/shared/lib/utils'
import { Star } from 'lucide-react'
import { PATHS } from '@/domain/constants/routes'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/shared/lib/format-date'
import { useDashboardRole } from '@/presentation/components/auth/role-guard'
import { useDashboardReviews } from '@/shared/lib/use-dashboard-reviews'
import { useAuthReady } from '@/shared/lib/use-auth-ready'
import { ReviewModal } from '@/presentation/components/features/review-modal'
import { LoadErrorAlert } from '@/presentation/components/ui/load-error-alert'

export function DashboardReviewsPage() {
  const { t, language } = useApp()
  const { authed, userId, ready } = useAuthReady()
  const router = useRouter()
  const role = useDashboardRole()
  const isClient = role === 'client'
  const [filter, setFilter] = useState<'all' | '5' | 'low'>('all')
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)
  const [editingReview, setEditingReview] = useState<ApiReview | null>(null)
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null)

  const { reviews, stats, loading, error, loadError, reload: loadReviews } = useDashboardReviews(
    role,
    ready && authed && Boolean(userId)
  )

  const filtered = reviews.filter((r) => {
    if (filter === '5') return r.rating === 5
    if (filter === 'low') return r.rating <= 3
    return true
  })

  const bars = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length
    const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0
    return { star, count, pct }
  })

  if (loading) {
    return <div className="h-48 animate-pulse rounded-xl bg-[var(--color-bg-muted)]" />
  }

  return (
    <div>
      {error && (
        <LoadErrorAlert error={loadError} scope="reviews" onRetry={loadReviews} className="mb-4" />
      )}
      {isClient && (
        <p className="mb-4 text-[14px] text-[var(--ishbor-text-muted)]">{t('client_reviews_written_desc')}</p>
      )}

      <div className="mb-5 rounded-xl border border-[var(--ishbor-border)] bg-[var(--neutral-0)] p-5 sm:p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="text-center sm:text-left">
            <p className="text-[56px] font-bold leading-none text-[var(--color-primary)]">
              {stats.count > 0 ? stats.average.toFixed(1) : t('value_not_available')}
            </p>
            {stats.count > 0 && <RatingStars rating={stats.average} size="lg" className="mt-2 justify-center sm:justify-start" />}
            <p className="mt-1 text-[13px] text-[var(--ishbor-text-muted)]">
              {isClient
                ? t('client_reviews_written_count').replace('{n}', String(stats.count))
                : t('reviews_count_label').replace('{n}', String(stats.count))}
            </p>
          </div>
          <div className="flex-1 space-y-2">
            {bars.map((b) => (
              <div key={b.star} className="flex items-center gap-2 text-[12px]">
                <span className="flex w-8 items-center gap-0.5">
                  {b.star}
                  <Star className="h-3 w-3 fill-[var(--rating-filled)] text-[var(--rating-filled)]" aria-hidden />
                </span>
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--ishbor-border)]">
                  <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${b.pct}%` }} />
                </div>
                <span className="w-12 text-right text-[var(--ishbor-text-muted)]">{b.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(['all', '5', 'low'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-[13px] font-medium',
                filter === f ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]' : 'text-[var(--ishbor-text-muted)]'
              )}
            >
              {f === 'all' ? t('filter_all_reviews') : f === '5' ? t('filter_five_star') : t('filter_low_reviews')}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Star />}
          title={t('no_reviews_yet')}
          description={reviews.length === 0 ? t('reviews_empty_cta') : undefined}
          action={
            reviews.length === 0
              ? {
                  label: isClient ? t('nav_orders') : t('nav_services'),
                  onClick: () => router.push(isClient ? PATHS.dashboardOrders : PATHS.services),
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="dashboard-order-card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <Avatar name={r.profiles?.full_name ?? '—'} size={40} />
                  <div>
                    <p className="font-bold text-[var(--ishbor-text)]">{r.profiles?.full_name ?? '—'}</p>
                    <RatingStars rating={r.rating} size="sm" className="mt-1" />
                  </div>
                </div>
                {r.created_at && (
                  <span className="text-[12px] text-[var(--ishbor-text-muted)]">
                    {formatDate(r.created_at, language)}
                  </span>
                )}
              </div>
              {r.comment && <p className="mt-3 text-[14px] text-[var(--ishbor-text-muted)]">{r.comment}</p>}
              {isClient && userId && r.reviewer_id === userId && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingReview(r)}>
                    {t('review_edit')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    loading={deleteLoadingId === r.id}
                    onClick={async () => {
                      if (!window.confirm(t('review_delete_confirm'))) return
                      setDeleteLoadingId(r.id)
                      try {
                        await api.deleteReview(r.id)
                        toast.success(t('review_deleted'))
                        loadReviews()
                      } catch {
                        toast.error(t('error_required'))
                      } finally {
                        setDeleteLoadingId(null)
                      }
                    }}
                  >
                    {t('review_delete')}
                  </Button>
                </div>
              )}
              {r.reply && (
                <p className="mt-3 rounded-lg bg-[var(--color-primary-light)] px-3 py-2 text-[13px] text-[var(--ishbor-text-sub)]">
                  <span className="font-semibold text-[var(--color-primary)]">{t('review_reply')}: </span>
                  {r.reply}
                </p>
              )}
              {!isClient && !r.reply && (
                <div className="mt-3">
                  {replyingId === r.id ? (
                    <div className="space-y-2">
                      <Textarea
                        rows={3}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={t('review_reply_ph')}
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          loading={replyLoading}
                          onClick={async () => {
                            if (!replyText.trim()) return
                            setReplyLoading(true)
                            try {
                              await api.replyToReview(r.id, replyText.trim())
                              loadReviews()
                              setReplyingId(null)
                              setReplyText('')
                              toast.success(t('save_success'))
                            } catch {
                              toast.error(t('error_required'))
                            } finally {
                              setReplyLoading(false)
                            }
                          }}
                        >
                          {t('review_reply_submit')}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setReplyingId(null)}>
                          {t('cancel')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setReplyingId(r.id)}>
                      {t('review_reply')}
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editingReview && (
        <ReviewModal
          orderId={editingReview.order_id}
          existingReview={{
            id: editingReview.id,
            rating: editingReview.rating,
            comment: editingReview.comment,
          }}
          onClose={() => setEditingReview(null)}
          onSubmitted={loadReviews}
        />
      )}
    </div>
  )
}
