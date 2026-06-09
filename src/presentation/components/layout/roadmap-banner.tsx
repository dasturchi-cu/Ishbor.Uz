'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { Input } from '@/presentation/components/ui/input'
import { Button } from '@/presentation/components/ui/button'
import type { TranslationKey } from '@/infrastructure/i18n'
import { saveWaitlistEmail } from '@/shared/lib/waitlist'
import { toast } from '@/presentation/components/ui/toast'

export function RoadmapBanner({
  titleKey,
  descKey,
  waitlistSource,
}: {
  titleKey: TranslationKey
  descKey: TranslationKey
  waitlistSource: string
}) {
  const { t } = useApp()
  const [email, setEmail] = useState('')

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error(t('newsletter_invalid_email'))
      return
    }
    const ok = await saveWaitlistEmail(trimmed, waitlistSource)
    if (ok) {
      toast.success(t('newsletter_thanks'))
      setEmail('')
    } else {
      toast.info(t('waitlist_saved_local'))
    }
  }

  return (
    <div className="mb-4 rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary-light)] px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-primary)]" aria-hidden />
          <div>
            <p className="text-[13px] font-semibold text-[var(--ishbor-text)]">{t(titleKey)}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-[var(--ishbor-text-muted)]">{t(descKey)}</p>
          </div>
        </div>
        <form onSubmit={handleWaitlist} className="flex w-full shrink-0 flex-col gap-2 sm:max-w-xs sm:flex-row">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('footer_newsletter_placeholder')}
            className="flex-1 bg-white"
          />
          <Button type="submit" variant="primary" size="sm">
            {t('roadmap_notify_me')}
          </Button>
        </form>
      </div>
    </div>
  )
}
