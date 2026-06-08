import type { Metadata } from 'next'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ishbor.uz'

export const DEFAULT_OG_IMAGE = `${SITE}/icon.svg`

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

/** Canonical + hreflang for client-side i18n (same URL, language in AppProvider). */
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
  const url = pageUrl(path)
  return {
    canonical: url,
    languages: {
      uz: url,
      ru: url,
      en: url,
      'x-default': url,
    },
  }
}
