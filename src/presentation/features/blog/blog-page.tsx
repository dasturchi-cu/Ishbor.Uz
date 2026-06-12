'use client'

import Link from 'next/link'
import '@/presentation/styles/route-catalog.css'
import { useApp } from '@/application/providers/app-provider'
import { MarketplaceCatalogHero } from '@/presentation/components/layout/marketplace-catalog-hero'
import { PageWrapper } from '@/presentation/components/layout/page-wrapper'
import { PATHS } from '@/domain/constants/routes'

const POSTS = [
  { slug: 'freelance-boshlash', titleKey: 'blog_post_1_title' as const, excerptKey: 'blog_post_1_excerpt' as const, date: '2026-05-12' },
] as const

export function BlogPage() {
  const { t } = useApp()

  return (
    <>
      <MarketplaceCatalogHero
        badge={t('nav_blog')}
        title={t('nav_blog')}
        subtitle={t('blog_subtitle')}
        primaryAction={{ label: t('browse_services'), href: PATHS.services }}
        secondaryAction={{ label: t('register'), href: PATHS.register, variant: 'outline' }}
        trustLine={t('trust_escrow')}
      />
      <PageWrapper className="bg-[var(--ishbor-bg)] pt-5 md:pt-6">
      <div className="space-y-3">
        {POSTS.map((post) => (
          <article key={post.slug} className="surface-panel p-4 transition-[var(--transition)] sm:p-5">
            <time className="text-[12px] font-medium text-[var(--ishbor-text-muted)]">{post.date}</time>
            <h2 className="mt-2 text-[16px] font-semibold leading-snug text-[var(--ishbor-text)]">
              <Link
                href={`${PATHS.blog}/${post.slug}`}
                className="transition hover:text-[var(--color-primary)]"
              >
                {t(post.titleKey)}
              </Link>
            </h2>
            <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-[var(--ishbor-text-muted)]">
              {t(post.excerptKey)}
            </p>
            <Link
              href={`${PATHS.blog}/${post.slug}`}
              className="mt-3 inline-flex items-center text-[13px] font-semibold text-[var(--color-primary)] transition hover:opacity-80"
            >
              {t('read_more')} →
            </Link>
          </article>
        ))}
      </div>

      </PageWrapper>
    </>
  )
}
