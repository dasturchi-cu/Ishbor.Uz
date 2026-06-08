'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/application/providers/app-provider'
import { Alert } from '@/presentation/components/ui/alert'
import { Button } from '@/presentation/components/ui/button'
import { getSupabase, isSupabaseConfigured } from '@/infrastructure/supabase/client'
import { toast } from '@/presentation/components/ui/toast'

export function VerifyEmailBanner() {
  const { t } = useApp()
  const [needsVerify, setNeedsVerify] = useState(false)
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured()) return
    getSupabase()
      .auth.getUser()
      .then(({ data }) => {
        const user = data.user
        if (!user?.email) return
        setEmail(user.email)
        setNeedsVerify(!user.email_confirmed_at)
      })
      .catch(() => undefined)
  }, [])

  if (!needsVerify) return null

  const resend = async () => {
    if (!email) return
    setSending(true)
    try {
      const { error } = await getSupabase().auth.resend({ type: 'signup', email })
      if (error) throw error
      toast.success(t('verify_email_resend'))
    } catch {
      toast.error(t('error_required'))
    } finally {
      setSending(false)
    }
  }

  return (
    <Alert variant="info" className="mb-4">
      <p className="text-[13px]">{t('verify_email_banner')}</p>
      <Button variant="outline" size="sm" className="mt-2" loading={sending} onClick={resend}>
        {t('verify_email_resend')}
      </Button>
    </Alert>
  )
}
