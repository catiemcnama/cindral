import { TRPCProvider } from '@/trpc/client'
import type { Metadata } from 'next'
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
  metadataBase: new URL('https://trycindral.com'),
  title: {
    default: 'Cindral - Compliance That Maps to Your Reality',
    template: '%s | Cindral',
  },
  description:
    'Transform complex regulations like the EU AI Act and DORA into actionable insights. Automatically map requirements to your systems, teams, and processes.',
  keywords: ['compliance', 'regulatory', 'DORA', 'AI Act', 'GDPR', 'GRC', 'governance', 'risk', 'fintech', 'regtech'],
  authors: [{ name: 'Cindral' }],
  creator: 'Cindral',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://trycindral.com',
    siteName: 'Cindral',
    title: 'Cindral - Compliance That Maps to Your Reality',
    description: 'Transform complex regulations into actionable insights. Stay ahead of DORA, AI Act, GDPR, and more.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Cindral - Modern GRC Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cindral - Compliance That Maps to Your Reality',
    description: 'Transform complex regulations into actionable insights.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  )
}
