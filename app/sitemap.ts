import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ishbor.uz'
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8001'

const STATIC_ROUTES = [
  '',
  '/login',
  '/register',
  '/services',
  '/freelancers',
  '/blog',
  '/help',
  '/pricing',
  '/terms',
  '/privacy',
  '/post-project',
  '/projects',
]

const BLOG_SLUGS = ['freelance-boshlash', 'click-payme', 'escrow-nima']

async function fetchPaginatedIds(path: string, pageSize = 50): Promise<string[]> {
  const ids: string[] = []
  let offset = 0
  for (let page = 0; page < 10; page += 1) {
    try {
      const res = await fetch(`${API_URL}${path}?limit=${pageSize}&offset=${offset}`, {
        next: { revalidate: 3600 },
      })
      if (!res.ok) break
      const data = (await res.json()) as Array<{ id?: string }>
      const batch = data.map((s) => s.id).filter((id): id is string => Boolean(id))
      ids.push(...batch)
      if (batch.length < pageSize) break
      offset += pageSize
    } catch {
      break
    }
  }
  return ids
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = STATIC_ROUTES.map((path) => ({
    url: `${BASE}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? ('daily' as const) : ('weekly' as const),
    priority: path === '' ? 1 : 0.7,
  }))

  const blogEntries = BLOG_SLUGS.map((slug) => ({
    url: `${BASE}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  const [serviceIds, freelancerIds, projectIds] = await Promise.all([
    fetchPaginatedIds('/api/v1/services'),
    fetchPaginatedIds('/api/v1/profiles/freelancers'),
    fetchPaginatedIds('/api/v1/projects?status=open'),
  ])

  const serviceEntries = serviceIds.map((id) => ({
    url: `${BASE}/services/${id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const freelancerEntries = freelancerIds.map((id) => ({
    url: `${BASE}/freelancer/${id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }))

  const projectEntries = projectIds.map((id) => ({
    url: `${BASE}/projects/${id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticEntries, ...blogEntries, ...serviceEntries, ...freelancerEntries, ...projectEntries]
}
