import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from './contexts/AuthContext'
import { BookProvider } from './contexts/BookContext'
import AuthWrapper from './components/AuthWrapper'

export const metadata: Metadata = {
  title: 'Book Tracker',
  description: 'Track your book collection and wishlist',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2563eb',
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
      </head>
      <body className="min-h-screen bg-gray-50">
        <AuthProvider>
          <AuthWrapper>
            <BookProvider>
              <div className="mx-auto max-w-md bg-white min-h-screen shadow-lg">
                {children}
              </div>
            </BookProvider>
          </AuthWrapper>
        </AuthProvider>
      </body>
    </html>
  )
} 