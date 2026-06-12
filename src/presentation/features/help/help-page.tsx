'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/presentation/components/ui/button'
import { EmptyState } from '@/presentation/components/ui/empty-state'
import { Input } from '@/presentation/components/ui/input'
import { toast } from '@/presentation/components/ui/toast'
import {
  CreditCard,
  FileSearch,
  Rocket,
  Search,
  ShoppingCart,
  Shield,
  UserCircle,
  ChevronDown,
  Briefcase,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useApp } from '@/application/providers/app-provider'
import { Breadcrumb } from '@/presentation/components/layout/breadcrumb'
import { IshborProtectionStrip } from '@/presentation/components/layout/ishbor-protection-strip'
import { PATHS } from '@/domain/constants/routes'
import type { TranslationKey } from '@/infrastructure/i18n'
import { cn } from '@/shared/lib/utils'

type HelpCategoryId = 'getting_started' | 'orders' | 'services' | 'account' | 'payments'

type HelpArticle = {
  category: HelpCategoryId
  qKey: TranslationKey
  aKey: TranslationKey
}

const TOP_CATEGORIES: {
  id: HelpCategoryId
  labelKey: TranslationKey
  icon: LucideIcon
  iconClass: string
}[] = [
  { id: 'getting_started', labelKey: 'help_cat_getting_started', icon: Rocket, iconClass: 'text-[var(--color-primary)]' },
  { id: 'orders', labelKey: 'help_cat_orders', icon: ShoppingCart, iconClass: 'text-[var(--color-primary)]' },
  { id: 'services', labelKey: 'help_cat_services', icon: FileSearch, iconClass: 'text-[var(--color-primary)]' },
]

const BOTTOM_CATEGORIES: {
  id: HelpCategoryId
  labelKey: TranslationKey
  icon: LucideIcon
  iconClass: string
}[] = [
  { id: 'account', labelKey: 'help_cat_account', icon: UserCircle, iconClass: 'text-[var(--color-primary)]' },
  { id: 'payments', labelKey: 'help_cat_payments', icon: CreditCard, iconClass: 'text-[var(--warning)]' },
]

const HELP_ARTICLES: HelpArticle[] = [
  { category: 'getting_started', qKey: 'help_gs_1_q', aKey: 'help_gs_1_a' },
  { category: 'getting_started', qKey: 'help_gs_2_q', aKey: 'help_gs_2_a' },
  { category: 'getting_started', qKey: 'help_gs_3_q', aKey: 'help_gs_3_a' },
  { category: 'orders', qKey: 'help_ord_1_q', aKey: 'help_ord_1_a' },
  { category: 'orders', qKey: 'help_ord_2_q', aKey: 'help_ord_2_a' },
  { category: 'orders', qKey: 'help_ord_3_q', aKey: 'help_ord_3_a' },
  { category: 'services', qKey: 'help_srv_1_q', aKey: 'help_srv_1_a' },
  { category: 'services', qKey: 'help_srv_2_q', aKey: 'help_srv_2_a' },
  { category: 'services', qKey: 'help_srv_3_q', aKey: 'help_srv_3_a' },
  { category: 'account', qKey: 'help_acc_1_q', aKey: 'help_acc_1_a' },
  { category: 'account', qKey: 'help_acc_2_q', aKey: 'help_acc_2_a' },
  { category: 'account', qKey: 'help_acc_3_q', aKey: 'help_acc_3_a' },
  { category: 'payments', qKey: 'help_pay_1_q', aKey: 'help_pay_1_a' },
  { category: 'payments', qKey: 'help_pay_2_q', aKey: 'help_pay_2_a' },
  { category: 'payments', qKey: 'help_pay_3_q', aKey: 'help_pay_3_a' },
]

const ALL_CATEGORIES = [...TOP_CATEGORIES, ...BOTTOM_CATEGORIES]

function CategoryTile({
  label,
  icon: Icon,
  iconClass,
  onClick,
}: {
  label: string
  icon: LucideIcon
  iconClass: string
  onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} className="help-category-tile group">
      <span className="help-category-icon">
        <Icon className={cn('h-14 w-14', iconClass)} strokeWidth={1.25} />
      </span>
      <span className="text-[14px] font-medium text-[var(--ishbor-text)] transition group-hover:text-[var(--color-primary)]">
        {label}
      </span>
    </button>
  )
}

function FaqAccordion({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-[var(--ishbor-border)] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="text-[14px] font-semibold text-[var(--ishbor-text)]">{question}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-[var(--ishbor-text-muted)] transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && (
        <p className="pb-4 text-[14px] leading-relaxed text-[var(--ishbor-text-muted)]">{answer}</p>
      )}
    </div>
  )
}

export function HelpPage() {
  const { t } = useApp()
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<HelpCategoryId | null>(null)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formMessage, setFormMessage] = useState('')

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formMessage.trim() || formMessage.trim().length < 10) {
      toast.error(t('help_form_required'))
      return
    }
    if (formEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail.trim())) {
      toast.error(t('help_form_email_invalid'))
      return
    }
    const subject = encodeURIComponent(
      t('help_support_subject').replace('{name}', formName.trim() || t('help_form_name'))
    )
    const body = encodeURIComponent(
      t('help_mail_body')
        .replace('{name}', formName)
        .replace('{email}', formEmail)
        .replace('{message}', formMessage)
    )
    window.location.href = `mailto:hello@ishbor.uz?subject=${subject}&body=${body}`
    toast.success(t('help_form_success'))
    setFormName('')
    setFormEmail('')
    setFormMessage('')
  }

  const normalizedQuery = query.trim().toLowerCase()

  const filteredArticles = useMemo(() => {
    return HELP_ARTICLES.filter((article) => {
      const matchesCategory = activeCategory ? article.category === activeCategory : true
      if (!normalizedQuery) return matchesCategory
      const q = t(article.qKey).toLowerCase()
      const a = t(article.aKey).toLowerCase()
      return matchesCategory && (q.includes(normalizedQuery) || a.includes(normalizedQuery))
    })
  }, [activeCategory, normalizedQuery, t])

  const scrollToCategory = (id: HelpCategoryId) => {
    setActiveCategory(id)
    document.getElementById(`help-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const showSections = normalizedQuery.length > 0 || activeCategory !== null

  return (
    <div className="min-h-screen bg-[var(--body-bg)] pb-16">
      <div className="layout-container max-w-[1280px] pt-5">
        <Breadcrumb
          items={[
            { label: t('home'), href: PATHS.home },
            { label: t('nav_help_center') },
          ]}
        />
      </div>
      <section className="help-hero">
        <div className="layout-container max-w-[1280px]">
          <h1 className="text-[24px] font-bold text-white sm:text-[28px]">{t('help_hero_title')}</h1>
          <div className="help-search mx-auto mt-6 max-w-[640px]">
            <Search className="h-5 w-5 shrink-0 text-[var(--ishbor-text-muted)]" />
            <input
              type="text"
              className="ishbor-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('help_search_placeholder')}
              aria-label={t('help_search_placeholder')}
            />
          </div>
        </div>
      </section>

      <section className="help-quick-actions layout-container max-w-[1280px]" aria-label={t('help_quick_links')}>
        <p className="help-quick-actions-label">{t('help_quick_links')}</p>
        <div className="help-quick-actions-grid">
          <Link href={PATHS.services} className="help-quick-action">
            <ShoppingCart className="h-5 w-5 shrink-0 text-[var(--color-primary)]" strokeWidth={2} />
            <span>{t('browse_services')}</span>
          </Link>
          <Link href={PATHS.postProject} className="help-quick-action">
            <Briefcase className="h-5 w-5 shrink-0 text-[var(--color-primary)]" strokeWidth={2} />
            <span>{t('post_project')}</span>
          </Link>
          <Link href={PATHS.buyerProtection} className="help-quick-action">
            <Shield className="h-5 w-5 shrink-0 text-[var(--color-primary)]" strokeWidth={2} />
            <span>{t('nav_buyer_protection')}</span>
          </Link>
        </div>
      </section>

      <div className="layout-container max-w-[1280px] pb-2">
        <IshborProtectionStrip compact />
      </div>

      <section className="layout-container max-w-[1280px] py-12 md:py-16">
        <h2 className="text-center text-[22px] font-bold text-[var(--ishbor-text)]">
          {t('help_faq_title')}
        </h2>

        <div className="mx-auto mt-10 grid max-w-[900px] grid-cols-1 gap-8 sm:grid-cols-3">
          {TOP_CATEGORIES.map((cat) => (
            <CategoryTile
              key={cat.id}
              label={t(cat.labelKey)}
              icon={cat.icon}
              iconClass={cat.iconClass}
              onClick={() => scrollToCategory(cat.id)}
            />
          ))}
        </div>

        <div className="mx-auto mt-8 flex max-w-[560px] flex-wrap justify-center gap-10 sm:gap-16">
          {BOTTOM_CATEGORIES.map((cat) => (
            <CategoryTile
              key={cat.id}
              label={t(cat.labelKey)}
              icon={cat.icon}
              iconClass={cat.iconClass}
              onClick={() => scrollToCategory(cat.id)}
            />
          ))}
        </div>

        {showSections && (
          <div className="mx-auto mt-14 max-w-[760px]">
            {normalizedQuery && filteredArticles.length === 0 && (
              <EmptyState
                icon={<Search />}
                title={t('help_search_empty_title')}
                description={t('help_no_results')}
                action={{
                  label: t('clear_filters'),
                  onClick: () => {
                    setQuery('')
                    setActiveCategory(null)
                  },
                  variant: 'outline',
                }}
              />
            )}

            {(activeCategory ? [activeCategory] : ALL_CATEGORIES.map((c) => c.id)).map((catId) => {
              const articles = filteredArticles.filter((a) => a.category === catId)
              if (articles.length === 0) return null
              const cat = ALL_CATEGORIES.find((c) => c.id === catId)
              if (!cat) return null

              return (
                <section key={catId} id={`help-${catId}`} className="mb-10 scroll-mt-28">
                  <h3 className="settings-section-title mb-3">
                    {t(cat.labelKey)}
                  </h3>
                  <div className="rounded-[var(--r-lg)] border border-[var(--ishbor-border)] bg-[var(--neutral-0)] px-5">
                    {articles.map((article) => (
                      <FaqAccordion
                        key={article.qKey}
                        question={t(article.qKey)}
                        answer={t(article.aKey)}
                      />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}

        <form
          onSubmit={handleSupportSubmit}
          className="mx-auto mt-12 max-w-lg rounded-[var(--r-lg)] border border-[var(--ishbor-border)] bg-[var(--neutral-0)] p-5 sm:p-6"
        >
          <h3 className="settings-section-title text-center">
            {t('help_form_title')}
          </h3>
          <div className="mt-4 space-y-3">
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder={t('help_form_name')}
              required
            />
            <Input
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder={t('help_form_email')}
              required
            />
            <textarea
              value={formMessage}
              onChange={(e) => setFormMessage(e.target.value)}
              placeholder={t('help_form_message')}
              required
              rows={4}
              className="w-full rounded-[var(--r-md)] border border-[var(--ishbor-border)] bg-[var(--neutral-0)] px-3 py-2.5 text-[14px] text-[var(--ishbor-text)] outline-none focus:border-[var(--color-primary)] focus:shadow-[var(--shadow-focus)]"
            />
          </div>
          <Button type="submit" variant="primary" fullWidth className="mt-4">
            {t('help_form_submit')}
          </Button>
        </form>

        <div className="mt-8 flex flex-col items-center gap-2 text-center">
          <p className="text-[13px] text-[var(--ishbor-text-muted)]">{t('help_contact_support')}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="mailto:hello@ishbor.uz"
              className="text-[14px] font-semibold text-[var(--color-primary)] hover:underline"
            >
              hello@ishbor.uz
            </a>
            <a
              href="https://t.me/ishboruz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[14px] font-semibold text-[var(--color-primary)] hover:underline"
            >
              Telegram @IshBorUz
            </a>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-[12px]">
            <Link href={PATHS.terms} className="text-[var(--ishbor-text-muted)] hover:text-[var(--color-primary)]">
              {t('footer_terms')}
            </Link>
            <Link href={PATHS.privacy} className="text-[var(--ishbor-text-muted)] hover:text-[var(--color-primary)]">
              {t('footer_privacy')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
