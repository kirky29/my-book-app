import type { Metadata, Viewport } from 'next'
import './globals.css'
import { BookProvider } from './contexts/BookContext'

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
        <BookProvider>
          <div className="mx-auto max-w-md bg-white min-h-screen shadow-lg">
            {children}
          </div>
        </BookProvider>
      </body>
    </html>
  )
} 