'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { BookOpen } from 'lucide-react'
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

  // Show loading screen while authentication state is being determined
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-600 to-primary-800 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white bg-opacity-20 p-4 rounded-full">
              <BookOpen className="w-12 h-12" />
            </div>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Loading your library...</p>
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