import type { NextConfig } from 'next'

const apiBase = (process.env['NEXT_PUBLIC_API_BASE_URL'] ?? 'http://localhost:3001').replace(/\/$/, '')

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiBase}/api/:path*`,
      },
      {
        source: '/health',
        destination: `${apiBase}/health`,
      },
    ]
  },
}

export default nextConfig
