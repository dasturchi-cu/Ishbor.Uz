import type { Metadata } from 'next'
import { ProjectDetailPage } from '@/presentation/features/projects/project-detail-page'
import { fetchProjectForMeta } from '@/infrastructure/api/server-fetch'
import { pageAlternates, pageUrl, ogImageUrls, ogImages } from '@/shared/lib/seo'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const project = await fetchProjectForMeta(id)
  const title = project?.title ? `${project.title} — IshBor.uz` : 'Loyiha — IshBor.uz'
  const description = project?.description?.slice(0, 160) ?? "O'zbekistondagi ochiq freelance loyihasi"
  return {
    title,
    description,
    alternates: pageAlternates(`/projects/${id}`),
    openGraph: {
      title,
      description,
      url: pageUrl(`/projects/${id}`),
      type: 'website',
      images: ogImages(),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImageUrls(),
    },
  }
}

export default async function ProjectDetailRoute({ params }: Props) {
  const { id } = await params
  return <ProjectDetailPage projectId={id} />
}
