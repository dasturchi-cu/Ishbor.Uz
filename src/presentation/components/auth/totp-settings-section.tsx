'use client'

import { useCallback, useRef, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Badge } from '@/presentation/components/ui/badge'
import { toast } from '@/presentation/components/ui/toast'
import { isSupabaseConfigured } from '@/infrastructure/supabase/client'
import { mapAuthErrorMessage } from '@/infrastructure/auth/error-messages'
import {
  enrollTotp,
  listVerifiedTotpFactors,
  unenrollTotp,
  verifyTotpEnrollment,
  type TotpEnrollData,
  type TotpFactorSummary,
} from '@/infrastructure/auth/mfa-totp'
import { useAuthedEffect } from '@/shared/lib/use-auth-ready'
import { useFocusTrap } from '@/shared/lib/use-focus-trap'
import { useEscapeClose } from '@/shared/lib/use-escape-close'
import { captureLoadError } from '@/shared/lib/load-error'

export function TotpSettingsSection() {
  const { t } = useApp()
  const [factors, setFactors] = useState<TotpFactorSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [enrollData, setEnrollData] = useState<TotpEnrollData | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  useFocusTrap(enrollOpen, dialogRef)
  useEscapeClose(enrollOpen, () => {
    setEnrollOpen(false)
    setEnrollData(null)
    setCode('')
  })

  const refreshFactors = useCallback(() => {
    if (!isSupabaseConfigured()) {
      setFactors([])
      setLoading(false)
      return
    }
    setLoading(true)
    listVerifiedTotpFactors()
      .then(setFactors)
      .catch((e) => {
        setFactors([])
        toast.error(captureLoadError(e, { scope: 'profile', apiPath: 'supabase/mfa' }, t))
      })
      .finally(() => setLoading(false))
  }, [t])

  useAuthedEffect(() => {
    refreshFactors()
  }, [refreshFactors])

  const handleStartEnroll = async () => {
    if (!isSupabaseConfigured()) {
      toast.error(t('auth_supabase_not_configured'))
      return
    }
    setBusy(true)
    try {
      const data = await enrollTotp('IshBor Authenticator')
      setEnrollData(data)
      setEnrollOpen(true)
      setCode('')
    } catch (err) {
      toast.error(
        err instanceof Error ? mapAuthErrorMessage(err.message, t) : t('mfa_enroll_error')
      )
    } finally {
      setBusy(false)
    }
  }

  const handleVerifyEnroll = async () => {
    if (!enrollData || code.trim().length < 6) {
      toast.error(t('mfa_invalid_code'))
      return
    }
    setBusy(true)
    try {
      await verifyTotpEnrollment(enrollData.factorId, code)
      toast.success(t('mfa_enroll_success'))
      setEnrollOpen(false)
      setEnrollData(null)
      setCode('')
      refreshFactors()
    } catch (err) {
      toast.error(
        err instanceof Error ? mapAuthErrorMessage(err.message, t) : t('mfa_invalid_code')
      )
    } finally {
      setBusy(false)
    }
  }

  const handleDisable = async (factorId: string) => {
    if (!window.confirm(t('mfa_disable_confirm'))) return
    setBusy(true)
    try {
      await unenrollTotp(factorId)
      toast.success(t('mfa_disable_success'))
      refreshFactors()
    } catch (err) {
      toast.error(
        err instanceof Error ? mapAuthErrorMessage(err.message, t) : t('error_required')
      )
    } finally {
      setBusy(false)
    }
  }

  const enabled = factors.length > 0

  return (
    <div>
      {loading ? (
        <div className="mt-4 h-10 w-40 animate-pulse rounded-lg bg-[var(--color-bg-muted)]" />
      ) : enabled ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Badge variant="success" className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            {t('mfa_enabled_badge')}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            loading={busy}
            onClick={() => handleDisable(factors[0].id)}
          >
            {t('disable_2fa')}
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          loading={busy}
          onClick={handleStartEnroll}
        >
          {t('enable_2fa')}
        </Button>
      )}

      {enrollOpen && enrollData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => {
            setEnrollOpen(false)
            setEnrollData(null)
            setCode('')
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mfa-enroll-title"
            className="w-full max-w-md rounded-xl border border-[var(--ishbor-border)] bg-[var(--neutral-0)] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="mfa-enroll-title" className="text-[16px] font-bold text-[var(--ishbor-text)]">
              {t('mfa_enroll_title')}
            </h3>
            <p className="mt-2 text-[13px] text-[var(--ishbor-text-muted)]">{t('mfa_enroll_desc')}</p>

            <div
              className="mx-auto mt-4 flex max-w-[200px] justify-center rounded-lg border border-[var(--ishbor-border)] bg-white p-3 [&_svg]:h-auto [&_svg]:w-full"
              dangerouslySetInnerHTML={{ __html: enrollData.qrCode }}
              aria-label={t('mfa_scan_qr')}
            />

            <p className="mt-3 text-[12px] text-[var(--ishbor-text-muted)]">{t('mfa_manual_secret')}</p>
            <code className="mt-1 block break-all rounded-md bg-[var(--neutral-50)] px-2 py-1.5 text-[12px] font-mono">
              {enrollData.secret}
            </code>

            <div className="mt-4">
              <Input
                label={t('mfa_code_label')}
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder={t('mfa_code_placeholder')}
              />
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="primary" size="sm" loading={busy} onClick={handleVerifyEnroll}>
                {t('mfa_verify_btn')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEnrollOpen(false)
                  setEnrollData(null)
                  setCode('')
                }}
              >
                {t('cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
