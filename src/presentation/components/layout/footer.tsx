'use client'

import Link from 'next/link'
import { BadgeCheck, Lock, Send, Shield } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { PATHS } from '@/domain/constants/routes'
import { BrandLogo } from '@/presentation/components/layout/brand-logo'

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

  return (
    <footer className="site-footer mt-auto border-t border-[var(--ishbor-border)] bg-[var(--surface-raised)]">
      <div className="layout-container max-w-[1280px] py-10 md:py-12">
        <div className="footer-trust-ribbon" role="list" aria-label={t('landing_buyer_protection')}>
          <span className="footer-trust-ribbon__item" role="listitem">
            <Shield className="h-4 w-4" aria-hidden />
            {t('trust_escrow')}
          </span>
          <span className="footer-trust-ribbon__item" role="listitem">
            <BadgeCheck className="h-4 w-4" aria-hidden />
            {t('trust_item_cert')}
          </span>
          <span className="footer-trust-ribbon__item" role="listitem">
            <Lock className="h-4 w-4" aria-hidden />
            {t('trust_commission')}
          </span>
        </div>
        <div className="footer-grid">
          <div className="footer-brand">
            <BrandLogo variant="footer" href={PATHS.home} />
            <p className="footer-about">{t('footer_about')}</p>
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
            <h4 className="footer-section-title">{t('footer_pages')}</h4>
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

          <div className="footer-trust">
            <h4 className="footer-section-title">{t('landing_buyer_protection')}</h4>
            <p className="footer-trust-desc">{t('footer_payments_note')}</p>
            <Link href={PATHS.buyerProtection} className="footer-trust-link">
              <Shield className="h-4 w-4 shrink-0" aria-hidden />
              {t('nav_buyer_protection')}
            </Link>
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
