'use client'

import { useApp } from '@/application/providers/app-provider'
import { Alert } from '@/presentation/components/ui/alert'
import { formatDate } from '@/shared/lib/format-date'

export function SuspendedBanner() {
  const { t, language, profile } = useApp()
  if (!profile?.is_suspended) return null

  const until = profile.suspended_until
    ? formatDate(profile.suspended_until, language)
    : null

  return (
    <Alert variant="error" className="mx-4 mb-4 mt-4 md:mx-6">
      <p className="font-semibold">{t('account_suspended_title')}</p>
      <p className="mt-1 text-[13px]">
        {profile.suspension_reason?.trim() || t('account_suspended_default_reason')}
        {until ? ` · ${t('account_suspended_until').replace('{date}', until)}` : ''}
      </p>
    </Alert>
  )
}
