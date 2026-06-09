'use client'

import { useState } from 'react'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { toast } from '@/presentation/components/ui/toast'
import { isSupabaseConfigured } from '@/infrastructure/supabase/client'
import { requestEmailChange } from '@/infrastructure/auth/account-security'
import { mapAuthErrorMessage } from '@/infrastructure/auth/error-messages'
import { loginSchema } from '@/domain/validators/auth'

export function EmailChangeSection() {
  const { t, profile } = useApp()
  const [newEmail, setNewEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const currentEmail = profile?.email ?? ''

  const handleSubmit = async () => {
    const trimmed = newEmail.trim()
    const parsed = loginSchema.shape.email.safeParse(trimmed)
    if (!parsed.success) {
      toast.error(t('error_email'))
      return
    }
    if (trimmed.toLowerCase() === currentEmail.toLowerCase()) {
      toast.error(t('change_email_same'))
      return
    }
    if (!isSupabaseConfigured()) {
      toast.error(t('auth_supabase_not_configured'))
      return
    }
    setBusy(true)
    try {
      await requestEmailChange(trimmed)
      setNewEmail('')
      toast.success(t('change_email_success'))
    } catch (err) {
      toast.error(
        err instanceof Error ? mapAuthErrorMessage(err.message, t) : t('error_required')
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <p className="settings-section-note">{t('change_email_desc')}</p>
      <div className="mt-4 grid gap-3 sm:max-w-[420px]">
        <div>
          <label className="settings-field-label">{t('email')}</label>
          <Input
            type="email"
            value={currentEmail}
            disabled
            className="catalog-control !h-[42px] opacity-70"
          />
        </div>
        <div>
          <label className="settings-field-label">{t('new_email_label')}</label>
          <Input
            type="email"
            autoComplete="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder={t('email_placeholder')}
            className="catalog-control !h-[42px]"
          />
        </div>
      </div>
      <div className="mt-4">
        <Button variant="outline" size="sm" loading={busy} onClick={handleSubmit}>
          {t('change_email_btn')}
        </Button>
      </div>
    </div>
  )
}
