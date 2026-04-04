import type { NextConfig } from 'next'

// Allow the API host to be configured via env so the app works on any port.
// NEXUS_API_URL takes full precedence; otherwise we build from NEXUS_API_PORT.
const apiBase =
  process.env.NEXUS_API_URL ??
  `http://localhost:${process.env.NEXUS_API_PORT ?? '3001'}`

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
