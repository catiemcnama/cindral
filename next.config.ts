import type { NextConfig } from 'next'

// Dynamic CORS origin based on environment
const corsOrigin = process.env.NEXT_PUBLIC_APP_URL || 'https://www.trycindral.com'

// Determine if we're in development mode
const isDev = process.env.NODE_ENV !== 'production'

// Content Security Policy - stricter in production
// unsafe-inline for styles is needed for Next.js inline styles
// unsafe-eval only allowed in development for Next.js HMR
const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.resend.com https://api.stripe.com https://*.sentry.io",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  'upgrade-insecure-requests',
]

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
        // Security headers for all routes
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: cspDirectives.join('; '),
          },
          // HSTS - enable in production
          ...(process.env.NODE_ENV === 'production'
            ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]
            : []),
        ],
      },
      {
        // Apply CORS headers to API routes
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: corsOrigin },
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
