export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'IshBor.uz',
  url: 'https://ishbor.uz',
  logo: 'https://ishbor.uz/logo.png',
  description: 'Leading freelance marketplace in Central Asia connecting talented freelancers with businesses',
  sameAs: [
    'https://twitter.com/ishboruz',
    'https://linkedin.com/company/ishbor',
    'https://facebook.com/ishbor',
  ],
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'UZ',
    addressLocality: 'Tashkent',
  },
}

export const platformSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'IshBor.uz',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: 'Freelance marketplace for hiring and finding work in Central Asia',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '5000',
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
}

export const breadcrumbSchema = (items: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
})
