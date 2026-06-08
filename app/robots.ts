import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ishbor.uz'
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/dashboard', '/settings', '/onboarding', '/auth', '/api'],
    },
    sitemap: `${base}/sitemap.xml`,
  }
}
