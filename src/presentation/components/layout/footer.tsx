'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Send } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { PATHS } from '@/domain/constants/routes'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { toast } from '@/presentation/components/ui/toast'
import { saveWaitlistEmail } from '@/shared/lib/waitlist'

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

export function Footer() {
  const { t } = useApp()
  const currentYear = new Date().getFullYear()
  const [email, setEmail] = useState('')

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) {
      toast.error(t('newsletter_invalid_email'))
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error(t('newsletter_invalid_email'))
      return
    }
    const ok = await saveWaitlistEmail(trimmed, 'footer')
    if (ok) {
      toast.success(t('newsletter_thanks'))
      setEmail('')
    } else {
      toast.info(t('waitlist_saved_local'))
      setEmail('')
    }
  }

  return (
    <footer className="site-footer mt-auto border-t border-[var(--ishbor-border)] bg-[var(--ishbor-bg)]">
      <div className="layout-container max-w-[1280px] py-10 md:py-12">
        <div className="footer-grid">
          <div className="footer-brand">
            <p className="footer-logo">
              IshBor<span>.uz</span>
            </p>
            <p className="footer-about">
              {t('footer_about')}
            </p>
            <div className="footer-social">
              <a
                href="https://t.me/ishboruz"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-link"
                aria-label={t('social_telegram')}
              >
                <Send className="h-4 w-4" />
              </a>
              <a
                href="https://instagram.com/ishboruz"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-link"
                aria-label={t('social_instagram')}
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="footer-nav">
            <h4 className="footer-overline">
              {t('footer_pages')}
            </h4>
            <ul className="footer-link-list">
              <li>
                <Link href={PATHS.services} className="text-[var(--ishbor-text-muted)] transition hover:text-[var(--color-primary)]">
                  {t('nav_services')}
                </Link>
              </li>
              <li>
                <Link href={PATHS.freelancers} className="text-[var(--ishbor-text-muted)] transition hover:text-[var(--color-primary)]">
                  {t('nav_freelancers')}
                </Link>
              </li>
              <li>
                <Link href={PATHS.projects} className="text-[var(--ishbor-text-muted)] transition hover:text-[var(--color-primary)]">
                  {t('nav_projects')}
                </Link>
              </li>
              <li>
                <Link href={PATHS.blog} className="text-[var(--ishbor-text-muted)] transition hover:text-[var(--color-primary)]">
                  {t('nav_blog')}
                </Link>
              </li>
              <li>
                <Link href={PATHS.pricing} className="text-[var(--ishbor-text-muted)] transition hover:text-[var(--color-primary)]">
                  {t('nav_pricing')}
                </Link>
              </li>
              <li>
                <Link href={PATHS.help} className="text-[var(--ishbor-text-muted)] transition hover:text-[var(--color-primary)]">
                  {t('nav_help_center')}
                </Link>
              </li>
            </ul>
          </div>

          <div className="footer-newsletter">
            <h4 className="footer-overline">
              {t('footer_newsletter_title')}
            </h4>
            <form onSubmit={handleNewsletter} className="footer-newsletter-form">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('footer_newsletter_placeholder')}
                className="input-touch flex-1"
                aria-label={t('footer_newsletter_placeholder')}
              />
              <Button type="submit" variant="primary" size="md" className="shrink-0">
                {t('footer_newsletter_btn')}
              </Button>
            </form>
            <p className="footer-payments-note">{t('footer_payments_note')}</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {currentYear} IshBor.uz</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href={PATHS.terms} className="transition hover:text-[var(--color-primary)]">
              {t('footer_terms')}
            </Link>
            <Link href={PATHS.privacy} className="transition hover:text-[var(--color-primary)]">
              {t('footer_privacy')}
            </Link>
            <span>{t('footer_rights')}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
