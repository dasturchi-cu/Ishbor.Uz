'use client'

import Link from 'next/link'
import { Button } from '@/presentation/components/ui/button'
import { useApp } from '@/application/providers/app-provider'
import { PageWrapper } from '@/presentation/components/layout/page-wrapper'
import { PATHS } from '@/domain/constants/routes'

const POSTS = [
  { slug: 'freelance-boshlash', titleKey: 'blog_post_1_title' as const, excerptKey: 'blog_post_1_excerpt' as const, date: '2026-05-12' },
] as const

export function BlogPage() {
  const { t } = useApp()

  return (
    <PageWrapper className="bg-[var(--kwork-bg)] pt-5 md:pt-6">
      <div className="surface-panel mb-5 px-4 py-3.5 sm:px-5 sm:py-4">
        <h1 className="text-xl font-bold tracking-tight text-[var(--kwork-text)] sm:text-[22px]">
          {t('nav_blog')}
        </h1>
        <p className="mt-1 text-[13px] text-[var(--kwork-text-muted)] sm:text-[14px]">
          {t('blog_subtitle')}
        </p>
      </div>

      <div className="space-y-3">
        {POSTS.map((post) => (
          <article key={post.slug} className="surface-panel p-4 transition-[var(--transition)] sm:p-5">
            <time className="text-[12px] font-medium text-[var(--kwork-text-muted)]">{post.date}</time>
            <h2 className="mt-2 text-[16px] font-semibold leading-snug text-[var(--kwork-text)]">
              <Link
                href={`${PATHS.blog}/${post.slug}`}
                className="transition hover:text-[var(--color-primary)]"
              >
                {t(post.titleKey)}
              </Link>
            </h2>
            <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-[var(--kwork-text-muted)]">
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

      <div className="mt-8 text-center">
        <Link href={PATHS.services}>
          <Button variant="outline">{t('browse_services')}</Button>
        </Link>
      </div>
    </PageWrapper>
  )
}
