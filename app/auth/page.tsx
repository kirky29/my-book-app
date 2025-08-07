'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, BookOpen, Mail, Lock, Sparkles, ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function AuthPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      router.push('/')
    } catch (error: any) {
      console.error('Auth error:', error)
      setError(getErrorMessage(error.code))
    } finally {
      setLoading(false)
    }
  }

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email'
      case 'auth/wrong-password':
        return 'Incorrect password'
      case 'auth/email-already-in-use':
        return 'An account with this email already exists'
      case 'auth/weak-password':
        return 'Password should be at least 6 characters'
      case 'auth/invalid-email':
        return 'Please enter a valid email address'
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.'
      default:
        return 'Something went wrong. Please try again.'
    }
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-lg sm:max-w-xl lg:max-w-2xl xl:max-w-3xl">
        {/* Hero Section */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-10">
          {/* App Logo */}
          <div className="relative mb-4 sm:mb-6 lg:mb-8">
            <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto shadow-xl sm:shadow-2xl">
              <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-white" />
            </div>
            {/* Floating sparkles animation */}
            <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-bounce delay-100">
              <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-3 lg:h-3 text-white" />
            </div>
            <div className="absolute -bottom-1 -left-1 w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 bg-pink-400 rounded-full animate-pulse delay-300"></div>
          </div>

          {/* App Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 sm:mb-3 lg:mb-4">Lorna's Books!</h1>
          <p className="text-gray-600 text-lg sm:text-xl lg:text-2xl">
            Welcome back to your library!
          </p>
        </div>

        {/* Auth Card */}
        <div className="card p-6 sm:p-8 lg:p-10 shadow-xl sm:shadow-2xl max-w-md mx-auto">
          {/* Form Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
              Sign In
            </h2>
            <p className="text-gray-600 text-sm sm:text-base lg:text-lg">
              Access your personal book collection
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">

            <div>
              <label htmlFor="email" className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 sm:mb-3">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-4 sm:left-5 top-1/2 transform -translate-y-1/2">
                  <Mail className="text-gray-400 w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-12 sm:pl-14 text-base sm:text-lg py-4 sm:py-5"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 sm:mb-3">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-4 sm:left-5 top-1/2 transform -translate-y-1/2">
                  <Lock className="text-gray-400 w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-12 sm:pl-14 pr-12 sm:pr-14 text-base sm:text-lg py-4 sm:py-5"
                  placeholder="Enter your password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 sm:right-5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Eye className="w-5 h-5 sm:w-6 sm:h-6" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg sm:rounded-xl p-3 sm:p-4 fade-in">
                <p className="text-red-700 text-xs sm:text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-4 sm:py-5 lg:py-6 text-base sm:text-lg lg:text-xl relative overflow-hidden group"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="spinner h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3"></div>
                  <span className="text-xs sm:text-sm">Signing In...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span className="text-sm sm:text-base">Sign In</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5 sm:ml-2 transform group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </button>
          </form>


        </div>

        {/* Info for users */}
        <div className="mt-6 sm:mt-8 bg-white/60 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-100 text-center max-w-md mx-auto">
          <p className="text-sm sm:text-base lg:text-lg text-gray-600">
            ✨ Your books will sync across all your devices once you sign in
          </p>
        </div>
      </div>
    </div>
  )
} 