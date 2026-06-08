'use client'

import { useEffect, useState } from 'react'
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
import { formatDate } from '@/shared/lib/format-date'

export function DashboardReviewsPage() {
  const { t, userId, language } = useApp()
  const [filter, setFilter] = useState<'all' | '5' | 'low'>('all')
  const [reviews, setReviews] = useState<ApiReview[]>([])
  const [stats, setStats] = useState({ average: 0, count: 0 })
  const [loading, setLoading] = useState(true)
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    Promise.all([
      api.listFreelancerReviews(userId).catch(() => [] as ApiReview[]),
      api.getFreelancerReviewStats(userId).catch(() => ({ average: 0, count: 0 })),
    ])
      .then(([revs, st]) => {
        setReviews(revs)
        setStats(st)
      })
      .finally(() => setLoading(false))
  }, [userId])

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
      <div className="mb-5 rounded-xl border border-[var(--kwork-border)] bg-[var(--neutral-0)] p-5 sm:p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="text-center sm:text-left">
            <p className="text-[56px] font-bold leading-none text-[var(--color-primary)]">
              {stats.count > 0 ? stats.average.toFixed(1) : '—'}
            </p>
            {stats.count > 0 && <RatingStars rating={stats.average} size="lg" className="mt-2 justify-center sm:justify-start" />}
            <p className="mt-1 text-[13px] text-[var(--kwork-text-muted)]">
              {t('reviews_count_label').replace('{n}', String(stats.count))}
            </p>
          </div>
          <div className="flex-1 space-y-2">
            {bars.map((b) => (
              <div key={b.star} className="flex items-center gap-2 text-[12px]">
                <span className="w-8">{b.star} ⭐</span>
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--kwork-border)]">
                  <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${b.pct}%` }} />
                </div>
                <span className="w-12 text-right text-[var(--kwork-text-muted)]">{b.count}</span>
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
                filter === f ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]' : 'text-[var(--kwork-text-muted)]'
              )}
            >
              {f === 'all' ? t('filter_all_reviews') : f === '5' ? '5 ⭐' : '≤3 ⭐'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Star />} title={t('no_reviews_yet')} />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="dashboard-order-card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <Avatar name={r.profiles?.full_name ?? '—'} size={40} />
                  <div>
                    <p className="font-bold text-[var(--kwork-text)]">{r.profiles?.full_name ?? '—'}</p>
                    <RatingStars rating={r.rating} size="sm" className="mt-1" />
                  </div>
                </div>
                {r.created_at && (
                  <span className="text-[12px] text-[var(--kwork-text-muted)]">
                    {formatDate(r.created_at, language)}
                  </span>
                )}
              </div>
              {r.comment && <p className="mt-3 text-[14px] text-[var(--kwork-text-muted)]">{r.comment}</p>}
              {r.reply && (
                <p className="mt-3 rounded-lg bg-[var(--color-primary-light)] px-3 py-2 text-[13px] text-[var(--kwork-text-sub)]">
                  <span className="font-semibold text-[var(--color-primary)]">{t('review_reply')}: </span>
                  {r.reply}
                </p>
              )}
              {!r.reply && (
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
                              const updated = await api.replyToReview(r.id, replyText.trim())
                              setReviews((prev) => prev.map((x) => (x.id === r.id ? updated : x)))
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
    </div>
  )
}
