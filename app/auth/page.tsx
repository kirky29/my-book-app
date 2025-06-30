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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Hero Section */}
        <div className="text-center mb-8">
          {/* App Logo */}
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            {/* Floating sparkles animation */}
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-bounce delay-100">
              <Sparkles className="w-2 h-2 text-white" />
            </div>
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-pink-400 rounded-full animate-pulse delay-300"></div>
          </div>

          {/* App Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Tracker</h1>
          <p className="text-gray-600 text-lg">
            {isLogin ? 'Welcome back to your library!' : 'Start your reading journey'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="card p-8 shadow-2xl">
          {/* Form Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Sign In' : 'Create Account'}
            </h2>
            <p className="text-gray-600 text-sm">
              {isLogin 
                ? 'Access your personal book collection' 
                : 'Join thousands of book lovers worldwide'
              }
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="fade-in">
                <label htmlFor="displayName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <User className="text-gray-400 w-5 h-5" />
                  </div>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="input pl-12"
                    placeholder="Enter your full name"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Mail className="text-gray-400 w-5 h-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-12"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Lock className="text-gray-400 w-5 h-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-12 pr-12"
                  placeholder={isLogin ? 'Enter your password' : 'Create a password (min 6 characters)'}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 fade-in">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full btn-lg relative overflow-hidden group"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="spinner h-5 w-5 mr-3"></div>
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </button>
          </form>

          {/* Toggle between login/signup */}
          <div className="mt-8 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">or</span>
              </div>
            </div>
            
            <div className="mt-6">
              <p className="text-gray-600 text-sm mb-3">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
              </p>
              <button
                onClick={toggleMode}
                className="btn btn-secondary w-full"
              >
                {isLogin ? 'Create New Account' : 'Sign In Instead'}
              </button>
            </div>
          </div>
        </div>

        {/* Features/Benefits */}
        {!isLogin && (
          <div className="mt-8 grid grid-cols-2 gap-4 text-center fade-in">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-100">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-sm font-semibold text-gray-800">Track Books</p>
              <p className="text-xs text-gray-600">Organize your library</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-100">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-sm font-semibold text-gray-800">Sync Everywhere</p>
              <p className="text-xs text-gray-600">Access on all devices</p>
            </div>
          </div>
        )}

        {/* Info for existing users */}
        {isLogin && (
          <div className="mt-6 bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-100 text-center">
            <p className="text-sm text-gray-600">
              ✨ Your books will sync across all your devices once you sign in
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 