'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Construction } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { PageWrapper } from '@/presentation/components/layout/page-wrapper'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { PATHS } from '@/domain/constants/routes'
import type { TranslationKey } from '@/infrastructure/i18n'
import { saveWaitlistEmail } from '@/shared/lib/waitlist'
import { toast } from '@/presentation/components/ui/toast'

interface ComingSoonPageProps {
  titleKey: TranslationKey
  descKey: TranslationKey
}

export function ComingSoonPage({ titleKey, descKey }: ComingSoonPageProps) {
  const { t } = useApp()
  const [email, setEmail] = useState('')

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error(t('newsletter_invalid_email'))
      return
    }
    const ok = await saveWaitlistEmail(trimmed, 'coming-soon')
    if (ok) {
      toast.success(t('newsletter_thanks'))
      setEmail('')
    } else {
      toast.info(t('waitlist_saved_local'))
    }
  }

  return (
    <PageWrapper className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-[var(--color-primary)] [&>svg]:h-14 [&>svg]:w-14">
        <Construction />
      </div>
      <h1 className="text-2xl font-bold text-[var(--kwork-text)]">{t(titleKey)}</h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-[var(--kwork-text-muted)]">{t(descKey)}</p>

      <form onSubmit={handleWaitlist} className="mt-8 flex w-full max-w-sm flex-col gap-2 sm:flex-row">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('footer_newsletter_placeholder')}
          className="flex-1"
        />
        <Button type="submit" variant="primary">
          {t('roadmap_notify_me')}
        </Button>
      </form>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href={PATHS.register}>
          <Button variant="primary">{t('start_now')}</Button>
        </Link>
        <Link href={PATHS.services}>
          <Button variant="outline">{t('nav_services')}</Button>
        </Link>
        <Link href={PATHS.home}>
          <Button variant="ghost">{t('home')}</Button>
        </Link>
      </div>
    </PageWrapper>
  )
}
