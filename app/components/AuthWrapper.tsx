'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { BookOpen, Sparkles } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface AuthWrapperProps {
  children: React.ReactNode
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== '/auth') {
        router.push('/auth')
      } else if (user && pathname === '/auth') {
        router.push('/')
      }
    }
  }, [user, loading, pathname, router])

  // Show beautiful loading screen while authentication state is being determined
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="text-center">
          {/* App Logo */}
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
              <BookOpen className="w-12 h-12 text-white" />
            </div>
            {/* Floating sparkles animation */}
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-bounce delay-100">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-pink-400 rounded-full animate-pulse delay-300"></div>
          </div>

          {/* App Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Tracker</h1>
            <p className="text-gray-600">Your personal library awaits</p>
          </div>

          {/* Beautiful Loading Animation */}
          <div className="relative mb-6">
            <div className="spinner h-12 w-12 mx-auto mb-4"></div>
            <div className="flex justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>

          <p className="text-lg font-medium text-gray-700">Loading your amazing library...</p>
        </div>
      </div>
    )
  }

  // If user is not authenticated and not on auth page, don't render children
  if (!user && pathname !== '/auth') {
    return null
  }

  // If user is authenticated and on auth page, don't render children
  if (user && pathname === '/auth') {
    return null
  }

  return <>{children}</>
} 