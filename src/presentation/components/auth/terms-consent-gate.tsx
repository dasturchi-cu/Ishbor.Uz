'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { api } from '@/infrastructure/api/client'
import { Button } from '@/presentation/components/ui/button'
import { PATHS } from '@/domain/constants/routes'
import { useAuthReady } from '@/shared/lib/use-auth-ready'
import { toast } from '@/presentation/components/ui/toast'
import { captureActionError } from '@/shared/lib/action-error'

const SKIP_PREFIXES = [PATHS.login, PATHS.register, PATHS.terms, PATHS.privacy, '/auth']

export function TermsConsentGate({ children }: { children: React.ReactNode }) {
  const { t } = useApp()
  const pathname = usePathname()
  const { ready, authed } = useAuthReady()
  const [pending, setPending] = useState<string[]>([])
  const [checking, setChecking] = useState(false)
  const [accepting, setAccepting] = useState(false)

  const skip = SKIP_PREFIXES.some((p) => pathname.startsWith(p))

  const refresh = useCallback(() => {
    if (!authed || skip) {
      setPending([])
      return
    }
    setChecking(true)
    api
      .getTermsConsentStatus()
      .then((status) => setPending(status.requires_consent ? status.pending : []))
      .catch(() => setPending([]))
      .finally(() => setChecking(false))
  }, [authed, skip])

  useEffect(() => {
    if (!ready) return
    refresh()
  }, [ready, refresh])

  const acceptAll = async () => {
    if (pending.length === 0) return
    setAccepting(true)
    try {
      await Promise.all(
        pending.map(async (docType) => {
          const doc = await api.getCurrentTerms(docType as 'terms' | 'privacy' | 'buyer_protection')
          await api.acceptTermsConsent(docType as 'terms' | 'privacy' | 'buyer_protection', doc.version)
        })
      )
      setPending([])
      toast.success(t('terms_consent_accept'))
    } catch (e) {
      toast.error(captureActionError(e, { scope: 'terms_consent' }, t))
    } finally {
      setAccepting(false)
    }
  }

  const blocked = authed && !skip && pending.length > 0

  return (
    <>
      {children}
      {blocked && !checking && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-xl border border-[var(--kwork-border)] bg-[var(--neutral-0)] p-6 shadow-lg"
          >
            <h2 className="text-lg font-bold text-[var(--kwork-text)]">{t('terms_consent_title')}</h2>
            <p className="mt-2 text-[13px] text-[var(--kwork-text-muted)]">{t('terms_consent_desc')}</p>
            <div className="mt-4 flex flex-wrap gap-3 text-[13px]">
              {pending.includes('terms') && (
                <Link href={PATHS.terms} className="font-medium text-[var(--color-primary)] hover:underline">
                  {t('terms_consent_read_terms')}
                </Link>
              )}
              {pending.includes('privacy') && (
                <Link href={PATHS.privacy} className="font-medium text-[var(--color-primary)] hover:underline">
                  {t('terms_consent_read_privacy')}
                </Link>
              )}
            </div>
            <Button variant="primary" fullWidth className="mt-6" loading={accepting} onClick={() => void acceptAll()}>
              {t('terms_consent_accept')}
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
