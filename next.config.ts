import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Redirect www to non-www to prevent CORS issues
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.trycindral.com',
          },
        ],
        destination: 'https://trycindral.com/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
