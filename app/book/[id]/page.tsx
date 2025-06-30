'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Edit3, Save, X, Trash2, Eye, Check, BookOpen, Calendar, User, Building2, Tag } from 'lucide-react'
import { useBooks } from '../../contexts/BookContext'

export default function BookProfile() {
  const router = useRouter()
  const params = useParams()
  const { getBook, updateBook, deleteBook, toggleBookStatus } = useBooks()
  const [book, setBook] = useState(getBook(params.id as string))
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [notes, setNotes] = useState(book?.notes || '')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)

  useEffect(() => {
    const foundBook = getBook(params.id as string)
    setBook(foundBook)
    setNotes(foundBook?.notes || '')
  }, [params.id, getBook])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showStatusDropdown) {
        setShowStatusDropdown(false)
      }
    }

    if (showStatusDropdown) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [showStatusDropdown])

  if (!book) {
    return (
      <div className="flex flex-col h-screen">
        <header className="bg-primary-600 text-white p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()} 
              className="p-2 hover:bg-primary-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-medium">Book Not Found</h1>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>This book could not be found.</p>
            <button 
              onClick={() => router.push('/')} 
              className="mt-4 btn btn-primary"
            >
              Back to Library
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleSaveNotes = async () => {
    try {
      await updateBook(book.id, { notes })
      setIsEditingNotes(false)
    } catch (error) {
      console.error('Error saving notes:', error)
      alert('Failed to save notes. Please try again.')
    }
  }

  const handleCancelNotes = () => {
    setNotes(book.notes || '')
    setIsEditingNotes(false)
  }

  const handleDeleteBook = async () => {
    try {
      await deleteBook(book.id)
      router.push('/')
    } catch (error) {
      console.error('Error deleting book:', error)
      alert('Failed to delete book. Please try again.')
    }
  }

  const handleStatusChange = async (newStatus: 'physical' | 'digital' | 'both' | 'read' | 'wishlist') => {
    try {
      await updateBook(book.id, { status: newStatus })
      // Update local state to reflect the new status
      const updatedBook = getBook(book.id)
      if (updatedBook) {
        setBook(updatedBook)
      }
      setShowStatusDropdown(false)
    } catch (error) {
      console.error('Error updating book status:', error)
      alert('Failed to update book status. Please try again.')
    }
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-primary-600 text-white p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.back()} 
            className="p-2 hover:bg-primary-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-medium truncate">Book Details</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Book Cover and Basic Info */}
        <div className="p-6 bg-gradient-to-b from-gray-50 to-white">
          <div className="flex gap-4">
            {book.cover ? (
              <img 
                src={book.cover} 
                alt={book.title}
                className="w-24 h-32 object-cover rounded-lg shadow-md flex-shrink-0"
              />
            ) : (
              <div className="w-24 h-32 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 mb-2">{book.title}</h1>
              <p className="text-gray-600 mb-3">{book.author}</p>
              
              {/* Status Badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                  ['physical', 'digital', 'both'].includes(book.status)
                    ? 'bg-green-100 text-green-800' 
                    : book.status === 'read'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {book.status === 'physical' && (
                    <>
                      <Check className="w-4 h-4" />
                      📚 Physical Copy
                    </>
                  )}
                  {book.status === 'digital' && (
                    <>
                      <Check className="w-4 h-4" />
                      📱 Digital Copy
                    </>
                  )}
                  {book.status === 'both' && (
                    <>
                      <Check className="w-4 h-4" />
                      📚📱 Both Formats
                    </>
                  )}
                  {book.status === 'read' && (
                    <>
                      <Check className="w-4 h-4" />
                      ✅ Read It
                    </>
                  )}
                  {book.status === 'wishlist' && (
                    <>
                      <Eye className="w-4 h-4" />
                      🔖 Want to Read
                    </>
                  )}
                </span>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowStatusDropdown(!showStatusDropdown)
                  }}
                  className="btn btn-secondary text-sm"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Change Status
                </button>
                
                {/* Status Dropdown */}
                {showStatusDropdown && (
                  <div 
                    className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="py-1">
                      <button
                        onClick={() => handleStatusChange('physical')}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                          book.status === 'physical' ? 'bg-green-50 text-green-800' : 'text-gray-700'
                        }`}
                      >
                        <span className="text-base">📚</span>
                        <div>
                          <div className="font-medium">Physical Copy</div>
                          <div className="text-xs text-gray-500">Own paperback/hardcover</div>
                        </div>
                        {book.status === 'physical' && <Check className="w-4 h-4 ml-auto text-green-600" />}
                      </button>
                      
                      <button
                        onClick={() => handleStatusChange('digital')}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                          book.status === 'digital' ? 'bg-green-50 text-green-800' : 'text-gray-700'
                        }`}
                      >
                        <span className="text-base">📱</span>
                        <div>
                          <div className="font-medium">Digital Copy</div>
                          <div className="text-xs text-gray-500">Kindle, audiobook, or ebook</div>
                        </div>
                        {book.status === 'digital' && <Check className="w-4 h-4 ml-auto text-green-600" />}
                      </button>
                      
                      <button
                        onClick={() => handleStatusChange('both')}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                          book.status === 'both' ? 'bg-green-50 text-green-800' : 'text-gray-700'
                        }`}
                      >
                        <span className="text-base">📚📱</span>
                        <div>
                          <div className="font-medium">Both Formats</div>
                          <div className="text-xs text-gray-500">Own physical + digital</div>
                        </div>
                        {book.status === 'both' && <Check className="w-4 h-4 ml-auto text-green-600" />}
                      </button>
                      
                      <button
                        onClick={() => handleStatusChange('read')}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                          book.status === 'read' ? 'bg-blue-50 text-blue-800' : 'text-gray-700'
                        }`}
                      >
                        <span className="text-base">✅</span>
                        <div>
                          <div className="font-medium">Read It</div>
                          <div className="text-xs text-gray-500">Borrowed, library, or finished</div>
                        </div>
                        {book.status === 'read' && <Check className="w-4 h-4 ml-auto text-blue-600" />}
                      </button>
                      
                      <button
                        onClick={() => handleStatusChange('wishlist')}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                          book.status === 'wishlist' ? 'bg-yellow-50 text-yellow-800' : 'text-gray-700'
                        }`}
                      >
                        <span className="text-base">🔖</span>
                        <div>
                          <div className="font-medium">Want to Read</div>
                          <div className="text-xs text-gray-500">Add to wishlist</div>
                        </div>
                        {book.status === 'wishlist' && <Check className="w-4 h-4 ml-auto text-yellow-600" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Book Details */}
        <div className="p-6 space-y-6">
          {/* Description */}
          {book.description && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <div 
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: book.description.replace(/\n/g, '<br/>') 
                }}
              />
            </div>
          )}

          {/* Book Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Book Information</h3>
            <div className="space-y-3">
              {book.publisher && (
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-gray-400" />
                  <div>
                    <span className="text-sm text-gray-500">Publisher</span>
                    <p className="text-gray-900">{book.publisher}</p>
                  </div>
                </div>
              )}
              
              {book.publishedDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <span className="text-sm text-gray-500">Published</span>
                    <p className="text-gray-900">{book.publishedDate}</p>
                  </div>
                </div>
              )}
              
              {book.pageCount && (
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-gray-400" />
                  <div>
                    <span className="text-sm text-gray-500">Pages</span>
                    <p className="text-gray-900">{book.pageCount} pages</p>
                  </div>
                </div>
              )}
              
              {book.isbn && (
                <div className="flex items-center gap-3">
                  <Tag className="w-5 h-5 text-gray-400" />
                  <div>
                    <span className="text-sm text-gray-500">ISBN</span>
                    <p className="text-gray-900 font-mono text-sm">{book.isbn}</p>
                  </div>
                </div>
              )}
              
              {book.categories && book.categories.length > 0 && (
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <span className="text-sm text-gray-500">Categories</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {book.categories.map((category, index) => (
                        <span 
                          key={index} 
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="text-sm text-gray-500">Added to Library</span>
                  <p className="text-gray-900">{book.dateAdded}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">My Notes</h3>
              {!isEditingNotes && (
                <button
                  onClick={() => setIsEditingNotes(true)}
                  className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {isEditingNotes ? (
              <div className="space-y-3">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add your thoughts, quotes, or reminders about this book..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveNotes}
                    className="btn btn-primary flex-1"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Save Notes
                  </button>
                  <button
                    onClick={handleCancelNotes}
                    className="btn btn-secondary flex-1"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className={`p-4 rounded-lg border-2 border-dashed ${
                book.notes ? 'border-gray-200 bg-gray-50' : 'border-gray-300'
              }`}>
                {book.notes ? (
                  <p className="text-gray-700 whitespace-pre-wrap">{book.notes}</p>
                ) : (
                  <p className="text-gray-400 italic">No notes yet. Tap the edit icon to add your thoughts about this book.</p>
                )}
              </div>
            )}
          </div>

          {/* Remove Book Section */}
          <div className="pt-6 border-t border-gray-200">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn btn-danger w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove Book from Library
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Remove Book?</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to remove "{book.title}" from your library? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBook}
                className="btn btn-danger flex-1"
              >
                Remove Book
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 