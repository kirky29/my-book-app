import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from './contexts/AuthContext'
import { BookProvider } from './contexts/BookContext'
import { StatusOptionsProvider } from './contexts/StatusOptionsContext'
import { SeriesProvider } from './contexts/SeriesContext'
import { TagsProvider } from './contexts/TagsContext'
import AuthWrapper from './components/AuthWrapper'

export const metadata: Metadata = {
  title: 'Book Tracker - Your Personal Library',
  description: 'Track your book collection, wishlist, and reading progress with style',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Book Tracker',
    startupImage: [
      {
        url: '/startup-image.png',
        media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)',
      },
    ],
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
  colorScheme: 'light',
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
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Book Tracker" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="apple-touch-icon" href="/book-icon.svg" />
        <link rel="apple-touch-startup-image" href="/startup-image.png" />
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Hide browser UI on iOS when added to home screen */
            @media all and (display-mode: standalone) {
              body {
                -webkit-user-select: none;
                -webkit-touch-callout: none;
                -webkit-tap-highlight-color: transparent;
              }
            }
            /* Prevent zoom on input focus */
            @media screen and (max-width: 767px) {
              input[type="text"],
              input[type="email"],
              input[type="password"],
              input[type="number"],
              input[type="tel"],
              input[type="url"],
              input[type="search"],
              textarea,
              select {
                font-size: 16px !important;
              }
            }
          `
        }} />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <AuthProvider>
          <AuthWrapper>
            <BookProvider>
              <StatusOptionsProvider>
                <SeriesProvider>
                  <TagsProvider>
                    <div className="flex justify-center min-h-screen">
                      <div className="w-full max-w-lg lg:max-w-2xl bg-white/95 backdrop-blur-sm min-h-screen shadow-2xl border-x border-gray-100">
                        {children}
                      </div>
                    </div>
                  </TagsProvider>
                </SeriesProvider>
              </StatusOptionsProvider>
            </BookProvider>
          </AuthWrapper>
        </AuthProvider>
      </body>
    </html>
  )
} 