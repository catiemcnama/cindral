import { TRPCProvider } from '@/trpc/client'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://trycindral.com'),
  title: {
    default: 'Cindral - AI-Powered Regulatory Compliance',
    template: '%s | Cindral',
  },
  description:
    'Cindral is an AI-powered regulatory compliance platform that helps financial institutions stay ahead of DORA, GDPR, AI Act, and other regulations.',
  keywords: [
    'regulatory compliance',
    'DORA',
    'GDPR',
    'AI Act',
    'compliance management',
    'GRC',
    'fintech',
    'regtech',
    'financial services',
    'risk management',
  ],
  authors: [{ name: 'Cindral' }],
  creator: 'Cindral',
  publisher: 'Cindral',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Cindral',
    title: 'Cindral - AI-Powered Regulatory Compliance',
    description:
      'AI-powered regulatory compliance platform for financial institutions. Stay ahead of DORA, GDPR, AI Act, and more.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Cindral - AI-Powered Regulatory Compliance',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cindral - AI-Powered Regulatory Compliance',
    description:
      'AI-powered regulatory compliance platform for financial institutions. Stay ahead of DORA, GDPR, AI Act, and more.',
    images: ['/og-image.png'],
    creator: '@trycindral',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/site.webmanifest',
  alternates: {
    canonical: '/',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Cindral',
              description: 'AI-powered regulatory compliance platform for financial institutions',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
                description: 'Free tier available',
              },
              author: {
                '@type': 'Organization',
                name: 'Cindral',
                url: process.env.NEXT_PUBLIC_APP_URL || 'https://trycindral.com',
              },
            }),
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  )
}
