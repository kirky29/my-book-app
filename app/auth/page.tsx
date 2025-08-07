'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, BookOpen, User, Mail, Lock, Sparkles, ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function AuthPage() {
  const router = useRouter()
  const { login, signup } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        await login(email, password)
      } else {
        if (!displayName.trim()) {
          setError('Please enter your name')
          setLoading(false)
          return
        }
        await signup(email, password, displayName.trim())
      }
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

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setError('')
    setEmail('')
    setPassword('')
    setDisplayName('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Hero Section */}
        <div className="text-center mb-6 sm:mb-8">
          {/* App Logo */}
          <div className="relative mb-4 sm:mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto shadow-xl sm:shadow-2xl">
              <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            {/* Floating sparkles animation */}
            <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-bounce delay-100">
              <Sparkles className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-white" />
            </div>
            <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-pink-400 rounded-full animate-pulse delay-300"></div>
          </div>

          {/* App Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Lorna's Books!</h1>
          <p className="text-gray-600 text-base sm:text-lg">
            {isLogin ? 'Welcome back to your library!' : 'Start your reading journey'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="card p-6 sm:p-8 shadow-xl sm:shadow-2xl">
          {/* Form Header */}
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">
              {isLogin ? 'Sign In' : 'Create Account'}
            </h2>
            <p className="text-gray-600 text-xs sm:text-sm">
              {isLogin 
                ? 'Access your personal book collection' 
                : 'Join thousands of book lovers worldwide'
              }
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {!isLogin && (
              <div className="fade-in">
                <label htmlFor="displayName" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2">
                    <User className="text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="input pl-10 sm:pl-12 text-sm sm:text-base"
                    placeholder="Enter your full name"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2">
                  <Mail className="text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10 sm:pl-12 text-sm sm:text-base"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2">
                  <Lock className="text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10 sm:pl-12 pr-10 sm:pr-12 text-sm sm:text-base"
                  placeholder={isLogin ? 'Enter your password' : 'Create a password (min 6 characters)'}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
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
              className="btn btn-primary w-full py-3 sm:py-4 text-sm sm:text-base relative overflow-hidden group"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="spinner h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3"></div>
                  <span className="text-xs sm:text-sm">{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span className="text-sm sm:text-base">{isLogin ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5 sm:ml-2 transform group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </button>
          </form>

          {/* Toggle between login/signup */}
          <div className="mt-6 sm:mt-8 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="px-3 sm:px-4 bg-white text-gray-500">or</span>
              </div>
            </div>
            
            <div className="mt-4 sm:mt-6">
              <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
              </p>
              <button
                onClick={toggleMode}
                className="btn btn-secondary w-full py-2.5 sm:py-3 text-xs sm:text-sm"
              >
                {isLogin ? 'Create New Account' : 'Sign In Instead'}
              </button>
            </div>
          </div>
        </div>

        {/* Features/Benefits */}
        {!isLogin && (
          <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-3 sm:gap-4 text-center fade-in">
            <div className="bg-white/60 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-100">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-800">Track Books</p>
              <p className="text-xs text-gray-600">Organize your library</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-100">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-800">Sync Everywhere</p>
              <p className="text-xs text-gray-600">Access on all devices</p>
            </div>
          </div>
        )}

        {/* Info for existing users */}
        {isLogin && (
          <div className="mt-4 sm:mt-6 bg-white/60 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-100 text-center">
            <p className="text-xs sm:text-sm text-gray-600">
              ✨ Your books will sync across all your devices once you sign in
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 