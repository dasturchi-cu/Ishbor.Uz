const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ishbor.uz'

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'IshBor.uz',
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
  description: "O'zbekistondagi freelance marketplace platformasi",
  sameAs: ['https://t.me/IshBorUz'],
}

export function JsonLdOrganization() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
    />
  )
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'IshBor.uz',
  url: SITE_URL,
  description: "O'zbekistondagi freelance marketplace platformasi",
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/services?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

export function JsonLdWebSite() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
    />
  )
}

export function JsonLdService({
  id,
  title,
  description,
  price,
  imageUrl,
  freelancerName,
}: {
  id: string
  title: string
  description: string
  price: number
  imageUrl?: string
  freelancerName?: string
}) {
  const json = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: title,
    description,
    url: `${SITE_URL}/services/${id}`,
    image: imageUrl,
    provider: freelancerName
      ? { '@type': 'Person', name: freelancerName }
      : { '@type': 'Organization', name: 'IshBor.uz' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'UZS',
      price,
      availability: 'https://schema.org/InStock',
    },
  }
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
  )
}

export function JsonLdPerson({
  id,
  name,
  description,
  imageUrl,
  rating,
  reviewCount,
}: {
  id: string
  name: string
  description?: string
  imageUrl?: string
  rating?: number
  reviewCount?: number
}) {
  const json: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    url: `${SITE_URL}/freelancer/${id}`,
    image: imageUrl,
    description,
  }
  if (rating && reviewCount) {
    json.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating,
      reviewCount,
    }
  }
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
  )
}

export function JsonLdBreadcrumb({ items }: { items: { name: string; path: string }[] }) {
  const json = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  }
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
  )
}
