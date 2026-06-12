'use client'

import { useState } from 'react'
import { Copy, Gift, Share2, Users } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { toast } from '@/presentation/components/ui/toast'
import { api } from '@/infrastructure/api/client'
import { formatPrice } from '@/shared/lib/format'
import { useAuthedEffect } from '@/shared/lib/use-auth-ready'
import { Skeleton } from '@/presentation/components/ui/skeleton'
import { ignoreWithLog } from '@/shared/lib/ignore-with-log'

export function ReferralBanner({ className }: { className?: string }) {
  const { t, userId } = useApp()
  const [copied, setCopied] = useState(false)
  const [referralCount, setReferralCount] = useState(0)
  const [bonusEarned, setBonusEarned] = useState(0)
  const [statsLoading, setStatsLoading] = useState(true)

  useAuthedEffect(() => {
    const load = () => {
      setStatsLoading(true)
      api
        .getReferralStats()
        .then((s) => {
          setReferralCount(s.count)
          setBonusEarned(s.bonus_earned ?? 0)
        })
        .catch((e) => ignoreWithLog(e, { scope: 'profile', apiPath: '/api/v1/profiles/me/referral' }))
        .finally(() => setStatsLoading(false))
    }

    if (typeof requestIdleCallback !== 'undefined') {
      const id = requestIdleCallback(load, { timeout: 2500 })
      return () => cancelIdleCallback(id)
    }
    const timer = window.setTimeout(load, 1200)
    return () => window.clearTimeout(timer)
  }, [])

  if (!userId) return null

  const link =
    typeof window !== 'undefined'
      ? `${window.location.origin}/register?ref=${encodeURIComponent(userId)}`
      : `/register?ref=${userId}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      toast.success(t('referral_copied'))
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t('error_required'))
    }
  }

  const share = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: t('referral_share_title'), text: t('referral_desc'), url: link })
        return
      } catch {
        /* user cancelled */
      }
    }
    await copy()
  }

  return (
    <div className={className ?? 'referral-banner'}>
      <div className="referral-banner-icon">
        <Gift className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="referral-banner-title">{t('referral_title')}</p>
        <p className="referral-banner-desc">{t('referral_desc')}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {statsLoading ? (
            <>
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-6 w-32 rounded-full" />
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary-light)] px-2.5 py-0.5 text-[12px] font-medium text-[var(--color-primary)]">
                <Users className="h-3 w-3" aria-hidden />
                {t('referral_stats_invited').replace('{n}', String(referralCount))}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--success-bg)] px-2.5 py-0.5 text-[12px] font-medium text-[var(--success-dark)]">
                <Gift className="h-3 w-3" aria-hidden />
                {t('referral_stats_bonus').replace('{amount}', formatPrice(bonusEarned))}
              </span>
            </>
          )}
        </div>
      </div>
      <div className="referral-banner-actions shrink-0">
        <Button variant="outline" size="md" className="min-h-[44px] w-full gap-1.5 sm:w-auto" onClick={share}>
          <Share2 className="h-3.5 w-3.5" />
          {t('referral_share')}
        </Button>
        <Button variant="outline" size="md" className="min-h-[44px] w-full gap-1.5 sm:w-auto" onClick={copy}>
          <Copy className="h-3.5 w-3.5" />
          {copied ? t('referral_copied') : t('referral_copy')}
        </Button>
      </div>
    </div>
  )
}
