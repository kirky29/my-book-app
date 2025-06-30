'use client'

import { useState } from 'react'
import { ArrowLeft, LogOut, User, Trash2, Download, Upload, Moon, Sun, Smartphone, Monitor, Palette, BookOpen, Shield, Bell, HelpCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import { useBooks } from '../contexts/BookContext'

export default function Settings() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { books } = useBooks()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/auth')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const handleExportData = () => {
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

  const ownedCount = books.filter(book => ['physical', 'digital', 'both'].includes(book.status)).length
  const wishlistCount = books.filter(book => book.status === 'wishlist').length
  const readCount = books.filter(book => book.readStatus === 'read').length

  return (
    <div className="flex flex-col mobile-container bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 touch-optimized">
      {/* Header */}
      <header className="header-gradient text-white safe-area-top">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              title="Go Back"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Settings</h1>
              <p className="text-white/80 text-sm">Manage your account and preferences</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
        <div className="space-y-6">
          {/* User Profile Section */}
          <div className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {user?.displayName || 'Book Lover'}
                </h2>
                <p className="text-gray-600 text-sm mb-2">{user?.email}</p>
                <p className="text-gray-500 text-xs">
                  Member since {user?.metadata?.creationTime ? 
                    new Date(user.metadata.creationTime).toLocaleDateString() : 
                    'Recently'
                  }
                </p>
              </div>
            </div>

            {/* Library Stats */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{ownedCount}</div>
                <div className="text-xs text-gray-600">Books Owned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{wishlistCount}</div>
                <div className="text-xs text-gray-600">Wishlist</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{readCount}</div>
                <div className="text-xs text-gray-600">Books Read</div>
              </div>
            </div>
          </div>

          {/* App Settings */}
          <div className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              App Preferences
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Palette className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">Theme</p>
                    <p className="text-sm text-gray-500">Currently: Light</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">Default View</p>
                    <p className="text-sm text-gray-500">List or Grid layout</p>
                  </div>
                </div>
                <div className="text-sm text-gray-600">List</div>
              </div>

              <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">Notifications</p>
                    <p className="text-sm text-gray-500">Reading reminders</p>
                  </div>
                </div>
                <div className="w-10 h-6 bg-gray-200 rounded-full relative">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 transition-transform"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Data Management
            </h3>
            <div className="space-y-3">
              <button
                onClick={handleExportData}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
              >
                <Download className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Export Library</p>
                  <p className="text-sm text-gray-500">Download your books as JSON</p>
                </div>
              </button>

              <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left">
                <Upload className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">Import Library</p>
                  <p className="text-sm text-gray-500">Restore from backup file</p>
                </div>
              </button>

              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-lg transition-colors text-left"
              >
                <Trash2 className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">Delete All Data</p>
                  <p className="text-sm text-red-600">Permanently remove all books</p>
                </div>
              </button>
            </div>
          </div>

          {/* Support */}
          <div className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Support & Info
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3">
                <span className="text-gray-700">App Version</span>
                <span className="text-sm text-gray-500">1.0.0</span>
              </div>
              <div className="flex items-center justify-between p-3">
                <span className="text-gray-700">Books in Library</span>
                <span className="text-sm text-gray-500">{books.length}</span>
              </div>
              <div className="flex items-center justify-between p-3">
                <span className="text-gray-700">Storage Used</span>
                <span className="text-sm text-gray-500">~{Math.round(JSON.stringify(books).length / 1024)} KB</span>
              </div>
            </div>
          </div>

          {/* Sign Out */}
          <button
            onClick={handleLogout}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl p-4 font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay fade-in safe-area-bottom">
          <div className="modal-content max-w-sm">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete All Data?</h3>
              <p className="text-gray-600 mb-6">
                This will permanently delete all {books.length} books in your library. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement delete all functionality
                    setShowDeleteConfirm(false)
                    alert('Delete functionality would be implemented here')
                  }}
                  className="btn btn-danger flex-1"
                >
                  Delete All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 