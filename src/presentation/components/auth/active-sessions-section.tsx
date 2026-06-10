'use client'

import { useCallback, useState } from 'react'
import { Monitor } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import { toast } from '@/presentation/components/ui/toast'
import { isSupabaseConfigured } from '@/infrastructure/supabase/client'
import {
  getCurrentSessionSummary,
  signOutOtherSessions,
  type SessionSummary,
} from '@/infrastructure/auth/account-security'
import { mapAuthErrorMessage } from '@/infrastructure/auth/error-messages'
import { useAuthedEffect } from '@/shared/lib/use-auth-ready'
import { formatDate } from '@/shared/lib/format-date'
import { captureLoadError } from '@/shared/lib/load-error'

export function ActiveSessionsSection() {
  const { t, language } = useApp()
  const [session, setSession] = useState<SessionSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(() => {
    if (!isSupabaseConfigured()) {
      setSession(null)
      setLoading(false)
      return
    }
    setLoading(true)
    getCurrentSessionSummary()
      .then(setSession)
      .catch((e) => {
        setSession(null)
        toast.error(captureLoadError(e, { scope: 'profile', apiPath: 'supabase/sessions' }, t))
      })
      .finally(() => setLoading(false))
  }, [t])

  useAuthedEffect(() => {
    refresh()
  }, [refresh])

  const handleLogoutOthers = async () => {
    if (!window.confirm(t('logout_other_sessions_confirm'))) return
    if (!isSupabaseConfigured()) {
      toast.error(t('auth_supabase_not_configured'))
      return
    }
    setBusy(true)
    try {
      await signOutOtherSessions()
      toast.success(t('logout_other_sessions_success'))
      refresh()
    } catch (err) {
      toast.error(
        err instanceof Error ? mapAuthErrorMessage(err.message, t) : t('error_required')
      )
    } finally {
      setBusy(false)
    }
  }

  const lastActive =
    session?.lastSignInAt != null
      ? formatDate(session.lastSignInAt, language)
      : t('value_not_available')

  return (
    <div>
      <p className="settings-section-note">{t('logout_other_sessions_desc')}</p>

      {loading ? (
        <div className="mt-4 h-14 animate-pulse rounded-lg bg-[var(--color-bg-muted)]" />
      ) : (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--ishbor-border)] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)]">
              <Monitor className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <p className="text-[13px] font-medium text-[var(--ishbor-text)]">
                {t('session_this_device')}
              </p>
              <p className="text-[12px] text-[var(--ishbor-text-muted)]">
                {t('session_last_active').replace('{date}', lastActive)}
              </p>
            </div>
          </div>
          <Badge variant="success">{t('session_current')}</Badge>
        </div>
      )}

      <div className="mt-4">
        <Button variant="outline" size="sm" loading={busy} onClick={handleLogoutOthers}>
          {t('logout_other_sessions')}
        </Button>
      </div>
    </div>
  )
}
