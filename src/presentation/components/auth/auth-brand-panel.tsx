'use client'

import { Check } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { PATHS } from '@/domain/constants/routes'
import { BrandLogo } from '@/presentation/components/layout/brand-logo'

const CHECK_KEYS = ['auth_check_1', 'auth_check_2', 'auth_check_3'] as const

export function AuthMobileTrust() {
  const { t } = useApp()
  return (
    <ul className="auth-mobile-trust show-mobile" aria-label={t('auth_trust_early_note')}>
      {CHECK_KEYS.map((key) => (
        <li key={key} className="auth-mobile-trust__chip">
          <Check className="h-3 w-3 shrink-0 text-[var(--color-primary)]" aria-hidden />
          <span>{t(key)}</span>
        </li>
      ))}
    </ul>
  )
}

export function AuthBrandPanel() {
  const { t } = useApp()

  return (
    <aside className="auth-brand-panel auth-brand-panel--legacy hide-mobile" aria-hidden={false}>
      <div className="auth-brand-panel__content">
        <BrandLogo variant="auth-panel" href={PATHS.home} />
        <p className="auth-brand-tagline">{t('auth_tagline')}</p>

        <ul className="auth-brand-checklist">
          {CHECK_KEYS.map((key) => (
            <li key={key}>
              <span className="auth-brand-checklist__icon" aria-hidden>
                <Check className="h-3.5 w-3.5" />
              </span>
              {t(key)}
            </li>
          ))}
        </ul>

        <p className="auth-brand-trust-note">{t('auth_trust_early_note')}</p>
      </div>

    </aside>
  )
}
