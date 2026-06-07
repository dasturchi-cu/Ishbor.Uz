/** @type {import('next').NextConfig} */
const nextConfig = {
  // Compiler optimizations
  reactCompiler: false, // Disable if not installed
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Performance
  compress: true,
  productionBrowserSourceMaps: false,
  poweredByHeader: false,

  // Redirects
  redirects: async () => [
    {
      source: '/services',
      destination: '/?page=services',
      permanent: false,
    },
    {
      source: '/jobs',
      destination: '/?page=services',
      permanent: false,
    },
    {
      source: '/projects',
      destination: '/?page=post-project',
      permanent: false,
    },
  ],

  // Headers for caching
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on',
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
      ],
    },
    // Cache static assets
    {
      source: '/static/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
    // Cache images
    {
      source: '/images/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],

  // Logging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
}

module.exports = nextConfig
