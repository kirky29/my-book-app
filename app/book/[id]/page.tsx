'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Edit3, Save, X, Trash2, Check, BookOpen, Calendar, Heart, CheckCircle } from 'lucide-react'
import { useBooks } from '../../contexts/BookContext'

export default function BookDetail() {
  const router = useRouter()
  const params = useParams()
  const { getBook, updateBook, deleteBook } = useBooks()
  const book = getBook(params.id as string)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!book) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white safe-area-top">
          <div className="flex items-center gap-3 px-6 py-4">
            <button 
              onClick={() => router.back()} 
              className="p-3 hover:bg-white/10 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold">Book Not Found</h1>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Book Not Found</h2>
            <p className="text-gray-600 mb-6">This book could not be found in your library.</p>
            <button 
              onClick={() => router.push('/')} 
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2 inline" />
              Back to Library
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleStatusToggle = async () => {
    if (!book) return
    
    try {
      const newStatus = book.status === 'owned' ? 'wishlist' : 'owned'
      await updateBook(book.id, { status: newStatus })
    } catch (error) {
      console.error('Error updating book status:', error)
      alert('Failed to update book status. Please try again.')
    }
  }

  const handleDeleteBook = async () => {
    if (!book) return
    
    try {
      await deleteBook(book.id)
      router.push('/')
    } catch (error) {
      console.error('Error deleting book:', error)
      alert('Failed to delete book. Please try again.')
    }
  }

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
          <h1 className="text-lg sm:text-xl font-semibold">Book Details</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="space-y-4 sm:space-y-6">
          {/* Book Cover & Basic Info */}
          <div className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="flex gap-4 sm:gap-6">
              {/* Book Cover */}
              <div className="flex-shrink-0">
                {book.cover ? (
                  <img 
                    src={book.cover} 
                    alt={book.title}
                    className="w-24 h-36 sm:w-32 sm:h-48 object-cover rounded-xl shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-36 sm:w-32 sm:h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center shadow-lg">
                    <BookOpen className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Book Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 leading-tight">
                  {book.title}
                </h2>
                <p className="text-base sm:text-lg text-gray-600 mb-4">
                  by {book.author}
                </p>

                {/* Status Badge */}
                <div className="mb-4">
                  <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
                    book.status === 'owned' 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {book.status === 'owned' ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Owned
                      </>
                    ) : (
                      <>
                        <Heart className="w-4 h-4" />
                        Wishlist
                      </>
                    )}
                  </span>
                </div>

                {/* Status Toggle Button */}
                <button
                  onClick={handleStatusToggle}
                  className={`px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-medium transition-colors text-sm ${
                    book.status === 'owned'
                      ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  {book.status === 'owned' ? 'Move to Wishlist' : 'Mark as Owned'}
                </button>
              </div>
            </div>
          </div>

          {/* Book Details */}
          <div className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl p-4 sm:p-6 shadow-sm">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Book Information</h3>
            <div className="space-y-4">
              {/* Date Added */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 font-medium">Added to Library</p>
                  <p className="text-gray-900 font-semibold">{book.dateAdded}</p>
                </div>
              </div>

              {/* ISBN */}
              {book.isbn && (
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 font-medium">ISBN</p>
                    <p className="text-gray-900 font-semibold font-mono text-sm sm:text-base break-all">{book.isbn}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl p-4 sm:p-6 shadow-sm">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/')}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Back to Library</p>
                    <p className="text-sm text-gray-500">Return to your book collection</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-between p-4 hover:bg-red-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-900">Remove Book</p>
                    <p className="text-sm text-red-600">Delete from your library</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Remove Book?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to remove <span className="font-semibold">"{book.title}"</span> from your library? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteBook}
                  className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2 inline" />
                  Remove Book
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 