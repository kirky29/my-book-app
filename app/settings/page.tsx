'use client'

import { useState } from 'react'
import { ArrowLeft, LogOut, User, Download, BookOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import { useBooks } from '../contexts/BookContext'

export default function Settings() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { books } = useBooks()

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/auth')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const handleExportLibrary = () => {
    const dataStr = JSON.stringify(books, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'my-book-library.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const ownedCount = books.filter(book => book.status === 'owned').length
  const wishlistCount = books.filter(book => book.status === 'wishlist').length

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white safe-area-top">
        <div className="flex items-center gap-3 px-4 sm:px-6 py-4">
          <button 
            onClick={() => router.back()} 
            className="p-3 hover:bg-white/10 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg sm:text-xl font-semibold">Settings</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="space-y-4 sm:space-y-6">
          {/* About Section */}
          <div className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl p-4 sm:p-6 shadow-sm">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">About</h3>
            <div className="space-y-3">
              <p className="text-gray-700 leading-relaxed">
                <strong>Book Tracker</strong> - "Do I own this book?" is a simple app to help you quickly check if you already own a book while shopping.
              </p>
              <p className="text-gray-600 text-sm">
                Perfect for bookstores, libraries, and online shopping. Just scan a barcode or search for a book to instantly see if it's in your collection.
              </p>
            </div>
          </div>

          {/* Library Stats */}
          <div className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl p-4 sm:p-6 shadow-sm">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Library Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600">{ownedCount}</div>
                <div className="text-sm text-blue-700 font-medium">Books Owned</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-amber-600">{wishlistCount}</div>
                <div className="text-sm text-amber-700 font-medium">Wishlist</div>
              </div>
            </div>
          </div>

          {/* Library Management */}
          <div className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl p-4 sm:p-6 shadow-sm">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Library Management</h3>
            <div className="space-y-3">
              <button
                onClick={handleExportLibrary}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Export Library</p>
                    <p className="text-sm text-gray-500">Download your books as JSON</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Account */}
          <div className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl p-4 sm:p-6 shadow-sm">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Account</h3>
            <div className="space-y-3">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-4 hover:bg-red-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-900">Sign Out</p>
                    <p className="text-sm text-red-600">Sign out of your account</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 