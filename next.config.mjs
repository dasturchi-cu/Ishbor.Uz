import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // HMR: brauzer 127.0.0.1 orqali ochilganda cross-origin bloklanmasin
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  serverExternalPackages: ['@sentry/nextjs'],
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async redirects() {
    return [
      { source: '/wallet', destination: '/dashboard/wallet', permanent: true },
      { source: '/settings', destination: '/dashboard/settings', permanent: true },
      { source: '/messages', destination: '/dashboard/messages', permanent: true },
      { source: '/services/create', destination: '/dashboard/services/new', permanent: true },
      { source: '/notifications', destination: '/dashboard/notifications', permanent: true },
    ]
  },
  async rewrites() {
    const backend = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8002'
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backend}/api/v1/:path*`,
      },
    ]
  },
  async headers() {
    const isProd = process.env.NODE_ENV === 'production'
    // Dev: React HMR/debug eval() kerak. Prod: unsafe-eval qo'shilmaydi.
    const scriptSrc = [
      "'self'",
      "'unsafe-inline'",
      ...(isProd ? [] : ["'unsafe-eval'"]),
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      'https://va.vercel-scripts.com',
    ].join(' ')
    const connectSrc = [
      "'self'",
      'https://*.supabase.co',
      'wss://*.supabase.co',
      'https://www.google-analytics.com',
      'https://vitals.vercel-insights.com',
      ...(isProd ? [] : ['ws://localhost:3000', 'ws://127.0.0.1:3000', 'http://127.0.0.1:8002', 'http://localhost:8002']),
    ].join(' ')
    const securityHeaders = [
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      // Video qo'ng'iroq: kamera/mikrofon faqat o'z domenida
      { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=()' },
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          `script-src ${scriptSrc}`,
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https://*.supabase.co https://www.google-analytics.com",
          "font-src 'self' data:",
          `connect-src ${connectSrc}`,
          "frame-ancestors 'self'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; '),
      },
    ]
    if (isProd) {
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload',
      })
    }
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default withBundleAnalyzer(nextConfig)
