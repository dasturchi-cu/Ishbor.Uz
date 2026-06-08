'use client'

import { useEffect, useState } from 'react'
import { Copy, Gift, Share2 } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { toast } from '@/presentation/components/ui/toast'
import { api } from '@/infrastructure/api/client'
import { formatPrice } from '@/shared/lib/format'

export function ReferralBanner({ className }: { className?: string }) {
  const { t, userId } = useApp()
  const [copied, setCopied] = useState(false)
  const [referralCount, setReferralCount] = useState(0)
  const [bonusEarned, setBonusEarned] = useState(0)

  useEffect(() => {
    if (!userId) return
    api
      .getReferralStats()
      .then((s) => {
        setReferralCount(s.count)
        setBonusEarned(s.bonus_earned ?? 0)
      })
      .catch(() => {})
  }, [userId])

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
        await navigator.share({ title: 'IshBor.uz', text: t('referral_desc'), url: link })
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
        <p className="referral-banner-desc">
          {bonusEarned > 0
            ? t('referral_bonus_earned').replace('{amount}', formatPrice(bonusEarned))
            : referralCount > 0
              ? t('referral_count').replace('{n}', String(referralCount))
              : t('referral_desc')}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={share}>
          <Share2 className="h-3.5 w-3.5" />
          {t('referral_share')}
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={copy}>
          <Copy className="h-3.5 w-3.5" />
          {copied ? t('referral_copied') : t('referral_copy')}
        </Button>
      </div>
    </div>
  )
}
