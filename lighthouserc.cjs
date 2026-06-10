/** Lighthouse CI — lokal: `pnpm dev` ishlab turganida `pnpm lighthouse` */
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/services',
        'http://localhost:3000/pricing',
        'http://localhost:3000/regions/toshkent-shahri',
      ],
      numberOfRuns: 1,
      settings: {
        preset: 'desktop',
        chromeFlags: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.55 }],
        'categories:accessibility': ['warn', { minScore: 0.85 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.85 }],
      },
    },
  },
}
