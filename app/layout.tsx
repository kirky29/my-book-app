import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from './contexts/AuthContext'
import { BookProvider } from './contexts/BookContext'
import AuthWrapper from './components/AuthWrapper'

export const metadata: Metadata = {
  title: 'Book Tracker - Your Personal Library',
  description: 'Track your book collection, wishlist, and reading progress with style',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Book Tracker',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#2563eb',
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Book Tracker" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <AuthProvider>
          <AuthWrapper>
            <BookProvider>
              <div className="mx-auto max-w-md bg-white/95 backdrop-blur-sm min-h-screen shadow-2xl border-x border-gray-100">
                {children}
              </div>
            </BookProvider>
          </AuthWrapper>
        </AuthProvider>
      </body>
    </html>
  )
} 