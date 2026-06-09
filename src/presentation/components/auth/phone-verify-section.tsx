'use client'

import { useState } from 'react'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { api } from '@/infrastructure/api/client'
import { toast } from '@/presentation/components/ui/toast'

interface PhoneVerifySectionProps {
  phone: string
  verified?: boolean
  onVerified?: () => void
}

export function PhoneVerifySection({ phone, verified, onVerified }: PhoneVerifySectionProps) {
  const { t } = useApp()
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  if (verified) {
    return (
      <p className="text-[13px] font-medium text-[var(--color-success)]">{t('phone_verified_badge')}</p>
    )
  }

  const sendOtp = async () => {
    if (!phone.trim()) {
      toast.error(t('error_phone_required'))
      return
    }
    setLoading(true)
    try {
      await api.sendPhoneOtp(phone.trim())
      setSent(true)
      toast.success(t('phone_otp_sent'))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('error_required'))
    } finally {
      setLoading(false)
    }
  }

  const verify = async () => {
    setLoading(true)
    try {
      await api.verifyPhoneOtp(phone.trim(), code.trim())
      toast.success(t('phone_verified_success'))
      onVerified?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('error_required'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <Button variant="primary" size="sm" loading={loading} onClick={() => void sendOtp()}>
        {sent ? t('phone_otp_resend') : t('settings_verify_now')}
      </Button>
      {sent && (
        <>
          <Input
            label={t('phone_otp_label')}
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
          />
          <Button variant="outline" size="sm" loading={loading} onClick={() => void verify()}>
            {t('phone_otp_confirm')}
          </Button>
        </>
      )}
    </div>
  )
}
