/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
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
