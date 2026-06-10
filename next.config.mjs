import bundleAnalyzer from '@next/bundle-analyzer'
import fs from 'fs'
import path from 'path'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** Dev: zombie port fallback — .dev-backend-port backend ishga tushganda yoziladi */
function readDevBackendUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL
  if (process.env.NODE_ENV === 'production') {
    return fromEnv ?? 'http://127.0.0.1:8002'
  }
  try {
    const file = path.join(process.cwd(), '.dev-backend-port')
    const port = parseInt(fs.readFileSync(file, 'utf8').trim(), 10)
    if (port >= 8002 && port <= 8020) {
      return `http://127.0.0.1:${port}`
    }
  } catch {
    // .dev-backend-port yo'q — .env.local yoki default
  }
  return fromEnv ?? 'http://127.0.0.1:8002'
}

const devBackendUrl = readDevBackendUrl()

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: devBackendUrl,
  },
  // HMR: brauzer 127.0.0.1 orqali ochilganda cross-origin bloklanmasin
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  logging: {
    incomingRequests: {
      ignore: [/\/_next\//, /\/favicon\.ico$/],
    },
  },
  serverExternalPackages: ['@sentry/nextjs'],
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
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
      { source: '/freelancer', destination: '/freelancers', permanent: true },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${devBackendUrl}/api/v1/:path*`,
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
      ...(isProd ? [] : ['ws://localhost:3000', 'ws://127.0.0.1:3000', 'http://127.0.0.1:8002', 'http://localhost:8002', 'http://127.0.0.1:8003', 'http://127.0.0.1:8004', 'http://127.0.0.1:8005', 'http://127.0.0.1:8006', 'http://127.0.0.1:8007', 'http://127.0.0.1:8008', 'http://127.0.0.1:8009', 'http://127.0.0.1:8010']),
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
