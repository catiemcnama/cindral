import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Redirect non-www to www for canonical URLs
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'trycindral.com' }],
        destination: 'https://www.trycindral.com/:path*',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        // Apply CORS headers to API routes
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: 'https://www.trycindral.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
          },
        ],
      },
    ]
  },
}

export default nextConfig
