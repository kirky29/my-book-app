'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Trash2, AlertTriangle } from 'lucide-react'
import { useBooks } from '../../../contexts/BookContext'

export default function DeleteBook() {
  const router = useRouter()
  const params = useParams()
  const { getBook, deleteBook } = useBooks()
  const book = getBook(params.id as string)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!book) {
      router.push('/')
    }
  }, [book, router])

  if (!book) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-600">Book not found.</p>
          </div>
        </div>
      </div>
    )
  }

  const handleDeleteBook = async () => {
    if (!book) return
    
    setIsDeleting(true)
    try {
      await deleteBook(book.id)
      router.push('/')
    } catch (error) {
      console.error('Error deleting book:', error)
      alert('Failed to delete book. Please try again.')
      setIsDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 safe-area-top">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()} 
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Remove Book</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-sm border border-gray-200">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Remove Book?</h2>
            
            <p className="text-gray-600 mb-8 leading-relaxed">
              Are you sure you want to remove <span className="font-semibold text-gray-900">"{book.title}"</span> from your library?
            </p>
            
            <p className="text-red-600 text-sm mb-8">
              This action cannot be undone and will permanently delete the book from your collection.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleDeleteBook}
                disabled={isDeleting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium disabled:bg-red-400 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Remove Book
                  </>
                )}
              </button>
              
              <button
                onClick={() => router.back()}
                disabled={isDeleting}
                className="w-full py-3 px-4 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 