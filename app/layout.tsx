import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'

export const metadata: Metadata = {
  title: 'CampusWatt — Energy Intelligence',
  description: 'Campus energy intelligence platform for monitoring, analyzing, and reducing energy consumption.',
  manifest: '/manifest.webmanifest',
  themeColor: '#1f8f79',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CampusWatt',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/icon-192.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
          <ServiceWorkerRegister />
          {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
