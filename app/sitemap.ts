import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ishbor.uz'

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', '/login', '/register', '/services', '/terms', '/privacy']
  return routes.map((path) => ({
    url: `${BASE}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.7,
  }))
}
