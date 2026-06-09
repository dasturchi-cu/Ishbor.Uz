'use client'

import Link from 'next/link'
import { Check, Quote } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { PATHS } from '@/domain/constants/routes'

const CHECK_KEYS = ['auth_check_1', 'auth_check_2', 'auth_check_3'] as const

export function AuthMobileTrust() {
  const { t } = useApp()
  return (
    <ul className="show-mobile mb-5 space-y-2 rounded-lg border border-[var(--ishbor-border)] bg-[var(--color-bg-subtle)] p-4">
      {CHECK_KEYS.map((key) => (
        <li key={key} className="flex items-start gap-2 text-[12px] text-[var(--ishbor-text-muted)]">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-primary)]" aria-hidden />
          {t(key)}
        </li>
      ))}
    </ul>
  )
}

export function AuthBrandPanel() {
  const { t } = useApp()

  return (
    <aside className="auth-brand-panel auth-brand-panel--legacy hide-mobile" aria-hidden={false}>
      <div className="auth-brand-panel__mesh" aria-hidden />
      <div className="auth-brand-panel__orb auth-brand-panel__orb--1" aria-hidden />
      <div className="auth-brand-panel__orb auth-brand-panel__orb--2" aria-hidden />

      <div className="auth-brand-panel__content">
        <Link href={PATHS.home} className="auth-brand-logo">
          <span className="auth-brand-logo__mark" aria-hidden />
          ISH<span className="auth-brand-logo__accent">BOR</span>
        </Link>
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

        <blockquote className="auth-brand-testimonial">
          <Quote className="auth-brand-testimonial__icon h-5 w-5" aria-hidden />
          <p className="auth-brand-testimonial__quote">&ldquo;{t('auth_testimonial_quote')}&rdquo;</p>
          <footer className="auth-brand-testimonial__author">{t('auth_testimonial_author')}</footer>
        </blockquote>
      </div>

    </aside>
  )
}
