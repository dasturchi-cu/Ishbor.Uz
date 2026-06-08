'use client'

import Link from 'next/link'
import { useApp } from '@/application/providers/app-provider'
import { PageWrapper } from '@/presentation/components/layout/page-wrapper'
import { PATHS } from '@/domain/constants/routes'
import type { TranslationKey } from '@/infrastructure/i18n'

interface BlogPostContentProps {
  slug: string
  titleKey: TranslationKey
  bodyKey: TranslationKey
  date: string
}

export function BlogPostContent({ titleKey, bodyKey, date }: BlogPostContentProps) {
  const { t } = useApp()

  return (
    <PageWrapper className="bg-[var(--kwork-bg)] pt-5 md:pt-6">
      <article className="surface-panel mx-auto max-w-[720px] p-5 sm:p-8">
        <Link
          href={PATHS.blog}
          className="text-[13px] font-semibold text-[var(--color-primary)] hover:opacity-80"
        >
          ← {t('nav_blog')}
        </Link>
        <time className="mt-4 block text-[12px] font-medium text-[var(--kwork-text-muted)]">{date}</time>
        <h1 className="mt-2 text-2xl font-bold text-[var(--kwork-text)] sm:text-[28px]">{t(titleKey)}</h1>
        <div className="prose-ishbor mt-6 space-y-4 text-[14px] leading-relaxed text-[var(--kwork-text-sub)]">
          <p>{t(bodyKey)}</p>
        </div>
      </article>
    </PageWrapper>
  )
}
