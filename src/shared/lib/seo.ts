import type { Metadata } from 'next'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ishbor.uz'

export const DEFAULT_OG_IMAGE = `${SITE}/og-image.svg`

export function pageUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${SITE}${normalized}`
}

export function ogImages(imageUrl?: string | null): { url: string; width: number; height: number; alt: string }[] {
  const url = imageUrl?.startsWith('http') ? imageUrl : imageUrl ? `${SITE}${imageUrl}` : DEFAULT_OG_IMAGE
  return [{ url, width: 1200, height: 630, alt: 'IshBor.uz' }]
}

export function ogImageUrls(imageUrl?: string | null): string[] {
  return ogImages(imageUrl).map((i) => i.url)
}

/** Canonical URL metadata (language is client-side via AppProvider — no fake hreflang). */
export function buildPageMetadata(
  path: string,
  title: string,
  description: string,
  imageUrl?: string | null
): Metadata {
  const images = ogImages(imageUrl)
  return {
    title,
    description,
    alternates: pageAlternates(path),
    openGraph: {
      title,
      description,
      url: pageUrl(path),
      type: 'website',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImageUrls(imageUrl),
    },
  }
}

export function pageAlternates(path: string): NonNullable<Metadata['alternates']> {
  return { canonical: pageUrl(path) }
}

/** Private/authenticated routes — noindex but allow follow for signed-in UX. */
export function noIndexMetadata(extra?: Metadata): Metadata {
  return {
    robots: { index: false, follow: false },
    ...extra,
  }
}
