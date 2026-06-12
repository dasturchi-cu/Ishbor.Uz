'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { PATHS } from '@/domain/constants/routes'
import { useAuthReady } from '@/shared/lib/use-auth-ready'
import { toast } from '@/presentation/components/ui/toast'
import { captureActionError } from '@/shared/lib/action-error'
import { logClientError } from '@/shared/lib/log-client-error'
import {
  acceptTermsConsentRemote,
  fetchCurrentTerms,
  fetchTermsConsentStatus,
} from '@/shared/lib/terms-consent-remote'

const SKIP_PREFIXES = [PATHS.login, PATHS.register, PATHS.onboarding, PATHS.terms, PATHS.privacy, '/auth']

export function TermsConsentGate({ children }: { children: React.ReactNode }) {
  const { t, userId } = useApp()
  const pathname = usePathname()
  const { ready, authed } = useAuthReady()
  const [pending, setPending] = useState<string[]>([])
  const [checking, setChecking] = useState(false)
  const [accepting, setAccepting] = useState(false)

  const skip = SKIP_PREFIXES.some((p) => pathname.startsWith(p))

  const refresh = useCallback(() => {
    if (!authed || !userId || skip) {
      setPending([])
      return
    }
    setChecking(true)
    fetchTermsConsentStatus(userId)
      .then((status) => setPending(status.requires_consent ? status.pending : []))
      .catch((e) => {
        logClientError(e, { scope: 'profile', apiPath: '/api/v1/platform/terms/consent-status' })
        setPending([])
      })
      .finally(() => setChecking(false))
  }, [authed, skip, userId])

  useEffect(() => {
    if (!ready) return
    refresh()
  }, [ready, refresh])

  const acceptAll = async () => {
    if (pending.length === 0 || !userId) return
    setAccepting(true)
    try {
      await Promise.all(
        pending.map(async (docType) => {
          const doc = await fetchCurrentTerms(docType as 'terms' | 'privacy' | 'buyer_protection')
          await acceptTermsConsentRemote(userId, docType as 'terms' | 'privacy' | 'buyer_protection', doc.version)
        }),
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
        <div className="ps-modal-backdrop z-[70]">
          <div role="dialog" aria-modal="true" className="ps-modal max-w-md">
            <h2 className="text-lg font-bold text-[var(--ishbor-text)]">{t('terms_consent_title')}</h2>
            <p className="mt-2 text-[13px] text-[var(--ishbor-text-muted)]">{t('terms_consent_desc')}</p>
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
