import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { BlogPostContent } from '@/presentation/features/blog/blog-post-content'
import type { TranslationKey } from '@/infrastructure/i18n'
import { buildPageMetadata } from '@/shared/lib/seo'

const POSTS: Record<string, { titleKey: TranslationKey; bodyKey: TranslationKey; date: string; titleUz: string; descUz: string }> = {
  'freelance-boshlash': {
    titleKey: 'blog_post_1_title',
    bodyKey: 'blog_post_1_body',
    date: '2026-05-12',
    titleUz: 'Freelance boshlash — IshBor.uz Blog',
    descUz: "O'zbekistonda freelance karyerani qanday boshlash haqida maslahatlar.",
  },
  'click-payme': {
    titleKey: 'blog_post_2_title',
    bodyKey: 'blog_post_2_body',
    date: '2026-04-28',
    titleUz: 'Click va Payme — IshBor.uz Blog',
    descUz: "Mahalliy to'lov tizimlari va marketplace integratsiyasi.",
  },
  'escrow-nima': {
    titleKey: 'blog_post_3_title',
    bodyKey: 'blog_post_3_body',
    date: '2026-03-15',
    titleUz: 'Escrow nima? — IshBor.uz Blog',
    descUz: 'Xavfsiz to\'lov va escrow himoyasi haqida.',
  },
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = POSTS[slug]
  if (!post) return { title: 'Blog — IshBor.uz' }
  return buildPageMetadata(`/blog/${slug}`, post.titleUz, post.descUz)
}

export function generateStaticParams() {
  return Object.keys(POSTS).map((slug) => ({ slug }))
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = POSTS[slug]
  if (!post) notFound()

  return <BlogPostContent slug={slug} titleKey={post.titleKey} bodyKey={post.bodyKey} date={post.date} />
}
