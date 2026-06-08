/** @type {import('next').NextConfig} */
const nextConfig = {
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
    const backend = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8001'
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backend}/api/v1/:path*`,
      },
    ]
  },
}

export default nextConfig
