'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Edit3, Save, X, Trash2, Eye, Check, BookOpen, Calendar, User, Building2, Tag, Star, Heart, Library, BookCheck, Share, Bookmark, UserCheck } from 'lucide-react'
import { useBooks } from '../../contexts/BookContext'
import StarRating from '../../components/StarRating'

export default function BookProfile() {
  const router = useRouter()
  const params = useParams()
  const { getBook, updateBook, deleteBook, toggleBookStatus } = useBooks()
  const [book, setBook] = useState(getBook(params.id as string))
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [notes, setNotes] = useState(book?.notes || '')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showReadingStatusDropdown, setShowReadingStatusDropdown] = useState(false)
  const [showLentPrompt, setShowLentPrompt] = useState(false)
  const [lentToName, setLentToName] = useState('')

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
      <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <header className="header-gradient text-white safe-area-top">
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
              className="btn btn-primary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
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

  const handleStatusChange = async (newStatus: 'physical' | 'digital' | 'both' | 'wishlist' | 'lent' | 'none') => {
    if (newStatus === 'lent') {
      setShowStatusDropdown(false)
      setShowLentPrompt(true)
      return
    }

    // Update local state immediately for instant visual feedback
    const updatedBook = { ...book, status: newStatus }
    setBook(updatedBook)

    try {
      await updateBook(book.id, { status: newStatus })
      setShowStatusDropdown(false)
    } catch (error) {
      console.error('Error updating book status:', error)
      // Revert the local state on error
      setBook(book)
      alert('Failed to update book status. Please try again.')
    }
  }

  const handleReadingStatusChange = async (newReadStatus: 'unread' | 'reading' | 'read') => {
    // Update local state immediately for instant visual feedback
    const updatedBook = { ...book, readStatus: newReadStatus }
    setBook(updatedBook)

    try {
      await updateBook(book.id, { readStatus: newReadStatus })
      setShowReadingStatusDropdown(false)
    } catch (error) {
      console.error('Error updating reading status:', error)
      // Revert the local state on error
      setBook(book)
      alert('Failed to update reading status. Please try again.')
    }
  }

  const handleRatingChange = async (newRating: number) => {
    // Update local state immediately for instant visual feedback
    const updatedBook = {
      ...book,
      rating: newRating === 0 ? undefined : newRating
    }
    setBook(updatedBook)

    try {
      await updateBook(book.id, { rating: newRating === 0 ? undefined : newRating })
    } catch (error) {
      console.error('Error updating rating:', error)
      // Revert the local state on error
      setBook(book)
      alert('Failed to update rating. Please try again.')
    }
  }

  const handleLentSubmit = async () => {
    if (!lentToName.trim()) {
      alert('Please enter the name of the person you lent the book to.')
      return
    }

    // Update local state immediately for instant visual feedback
    const updatedBook = { 
      ...book, 
      status: 'lent' as const,
      lentTo: lentToName.trim()
    }
    setBook(updatedBook)

    try {
      await updateBook(book.id, { 
        status: 'lent',
        lentTo: lentToName.trim()
      })
      setShowLentPrompt(false)
      setLentToName('')
    } catch (error) {
      console.error('Error updating book status:', error)
      // Revert the local state on error
      setBook(book)
      alert('Failed to update book status. Please try again.')
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <header className="header-gradient text-white safe-area-top">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()} 
              className="p-3 hover:bg-white/10 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold">Book Details</h1>
              <p className="text-white/80 text-sm">Your library</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-3 hover:bg-white/10 rounded-xl transition-colors">
              <Share className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Hero Section with Book Cover */}
        <div className="px-6 py-8 bg-gradient-to-b from-white/80 to-white/60 backdrop-blur-sm">
          <div className="flex gap-6 mb-6">
            {/* Book Cover */}
            <div className="flex-shrink-0">
              {book.cover ? (
                <img 
                  src={book.cover} 
                  alt={book.title}
                  className="w-28 h-40 object-cover rounded-2xl shadow-xl border border-gray-100"
                />
              ) : (
                <div className="w-28 h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center shadow-xl border border-gray-100">
                  <BookOpen className="w-10 h-10 text-gray-400" />
                </div>
              )}
            </div>

            {/* Book Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">{book.title}</h1>
              <p className="text-lg text-gray-600 mb-4">{book.author}</p>
              
              {/* Status Badges */}
              <div className="mb-4 flex flex-wrap gap-2">
                {/* Ownership Status Badge */}
                <span className={`status-badge ${
                  ['physical', 'digital', 'both'].includes(book.status)
                    ? 'status-owned' 
                    : book.status === 'lent'
                    ? 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border border-orange-200'
                    : 'status-wishlist'
                }`}>
                  {book.status === 'physical' && (
                    <>
                      <Library className="w-4 h-4" />
                      Physical Copy
                    </>
                  )}
                  {book.status === 'digital' && (
                    <>
                      <BookOpen className="w-4 h-4" />
                      Digital Copy
                    </>
                  )}
                  {book.status === 'both' && (
                    <>
                      <Star className="w-4 h-4" />
                      Both Formats
                    </>
                  )}
                  {book.status === 'lent' && (
                    <>
                      <UserCheck className="w-4 h-4" />
                      Lent to {book.lentTo || 'Someone'}
                    </>
                  )}
                  {book.status === 'wishlist' && (
                    <>
                      <Heart className="w-4 h-4" />
                      Want to Read
                    </>
                  )}
                  {book.status === 'none' && (
                    <>
                      <Eye className="w-4 h-4" />
                      Not Owned
                    </>
                  )}
                </span>

                {/* Reading Status Badge */}
                {book.readStatus && book.readStatus !== 'unread' && (
                  <span className={`status-badge ${
                    book.readStatus === 'read' 
                      ? 'status-read'
                      : 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 border border-purple-200'
                  }`}>
                    {book.readStatus === 'read' && (
                      <>
                        <BookCheck className="w-4 h-4" />
                        Finished Reading
                      </>
                    )}
                    {book.readStatus === 'reading' && (
                      <>
                        <BookOpen className="w-4 h-4" />
                        Currently Reading
                      </>
                    )}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowStatusDropdown(!showStatusDropdown)
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
                >
                  <Library className="w-4 h-4" />
                  Ownership
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowReadingStatusDropdown(!showReadingStatusDropdown)
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
                >
                  <BookCheck className="w-4 h-4" />
                  Reading
                </button>
              </div>
            </div>
          </div>

          {/* Ownership Status Dropdown */}
          {showStatusDropdown && (
            <div className="card p-2 mb-6">
              <div className="space-y-1">
                <button
                  onClick={() => handleStatusChange('physical')}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center gap-3 ${
                    book.status === 'physical' ? 'bg-emerald-50 text-emerald-800' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Library className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">Physical Copy</div>
                    <div className="text-sm opacity-70">Own paperback/hardcover</div>
                  </div>
                  {book.status === 'physical' && <Check className="w-5 h-5 text-emerald-600" />}
                </button>
                
                <button
                  onClick={() => handleStatusChange('digital')}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center gap-3 ${
                    book.status === 'digital' ? 'bg-blue-50 text-blue-800' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">Digital Copy</div>
                    <div className="text-sm opacity-70">Kindle, audiobook, or ebook</div>
                  </div>
                  {book.status === 'digital' && <Check className="w-5 h-5 text-blue-600" />}
                </button>
                
                <button
                  onClick={() => handleStatusChange('both')}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center gap-3 ${
                    book.status === 'both' ? 'bg-purple-50 text-purple-800' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Star className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">Both Formats</div>
                    <div className="text-sm opacity-70">Own physical + digital</div>
                  </div>
                  {book.status === 'both' && <Check className="w-5 h-5 text-purple-600" />}
                </button>
                
                <button
                  onClick={() => handleStatusChange('none')}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center gap-3 ${
                    book.status === 'none' ? 'bg-gray-50 text-gray-800' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Eye className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">Not Owned</div>
                    <div className="text-sm opacity-70">Read but don't own a copy</div>
                  </div>
                  {book.status === 'none' && <Check className="w-5 h-5 text-gray-600" />}
                </button>

                <button
                  onClick={() => handleStatusChange('lent')}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center gap-3 ${
                    book.status === 'lent' ? 'bg-orange-50 text-orange-800' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <UserCheck className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">Lent Out</div>
                    <div className="text-sm opacity-70">Loaned to someone</div>
                  </div>
                  {book.status === 'lent' && <Check className="w-5 h-5 text-orange-600" />}
                </button>
                
                <button
                  onClick={() => handleStatusChange('wishlist')}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center gap-3 ${
                    book.status === 'wishlist' ? 'bg-amber-50 text-amber-800' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Heart className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">Want to Read</div>
                    <div className="text-sm opacity-70">Add to wishlist</div>
                  </div>
                  {book.status === 'wishlist' && <Check className="w-5 h-5 text-amber-600" />}
                </button>
              </div>
            </div>
          )}

          {/* Reading Status Dropdown */}
          {showReadingStatusDropdown && (
            <div className="card p-2 mb-6">
              <div className="space-y-1">
                <button
                  onClick={() => handleReadingStatusChange('unread')}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center gap-3 ${
                    book.readStatus === 'unread' ? 'bg-gray-50 text-gray-800' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">Not Started</div>
                    <div className="text-sm opacity-70">Haven't begun reading</div>
                  </div>
                  {book.readStatus === 'unread' && <Check className="w-5 h-5 text-gray-600" />}
                </button>
                
                <button
                  onClick={() => handleReadingStatusChange('reading')}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center gap-3 ${
                    book.readStatus === 'reading' ? 'bg-purple-50 text-purple-800' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">Currently Reading</div>
                    <div className="text-sm opacity-70">Making progress through the book</div>
                  </div>
                  {book.readStatus === 'reading' && <Check className="w-5 h-5 text-purple-600" />}
                </button>
                
                <button
                  onClick={() => handleReadingStatusChange('read')}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center gap-3 ${
                    book.readStatus === 'read' ? 'bg-indigo-50 text-indigo-800' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <BookCheck className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">Finished</div>
                    <div className="text-sm opacity-70">Completed reading</div>
                  </div>
                  {book.readStatus === 'read' && <Check className="w-5 h-5 text-indigo-600" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Book Details Cards */}
        <div className="px-6 space-y-6 pb-8">
          {/* Description Card */}
          {book.description && (
            <div className="card p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-3 h-3 text-blue-600" />
                </div>
                Description
              </h3>
              <div 
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: book.description.replace(/\n/g, '<br/>') 
                }}
              />
            </div>
          )}

          {/* Rating Card */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-3 h-3 text-yellow-600" />
              </div>
              My Rating
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <StarRating
                  rating={book.rating || 0}
                  onRatingChange={handleRatingChange}
                  size="lg"
                />
                {!book.rating && (
                  <p className="text-sm text-gray-500 mt-2">
                    Tap the stars to rate this book
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Book Information Card */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Tag className="w-3 h-3 text-emerald-600" />
              </div>
              Book Information
            </h3>
            <div className="space-y-4">
              {book.publisher && (
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 font-medium">Publisher</p>
                    <p className="text-gray-900 font-semibold">{book.publisher}</p>
                  </div>
                </div>
              )}
              
              {book.publishedDate && (
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 font-medium">Published</p>
                    <p className="text-gray-900 font-semibold">{book.publishedDate}</p>
                  </div>
                </div>
              )}
              
              {book.pageCount && (
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 font-medium">Pages</p>
                    <p className="text-gray-900 font-semibold">{book.pageCount} pages</p>
                  </div>
                </div>
              )}
              
              {book.isbn && (
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Tag className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 font-medium">ISBN</p>
                    <p className="text-gray-900 font-mono text-sm font-semibold">{book.isbn}</p>
                  </div>
                </div>
              )}
              
              {book.categories && book.categories.length > 0 && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 font-medium mb-2">Categories</p>
                    <div className="flex flex-wrap gap-2">
                      {book.categories.map((category, index) => (
                        <span 
                          key={index} 
                          className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {book.status === 'lent' && book.lentTo && (
                <div className="flex items-center gap-4 pt-2 border-t border-orange-100 bg-orange-50 rounded-lg p-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <UserCheck className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-orange-700 font-medium">Lent to</p>
                    <p className="text-orange-900 font-semibold">{book.lentTo}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 font-medium">Added to Library</p>
                  <p className="text-gray-900 font-semibold">{book.dateAdded}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Card */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Edit3 className="w-3 h-3 text-purple-600" />
                </div>
                My Notes
              </h3>
              {!isEditingNotes && (
                <button
                  onClick={() => setIsEditingNotes(true)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {isEditingNotes ? (
              <div className="space-y-4">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add your thoughts, quotes, or reminders about this book..."
                  className="w-full h-32 p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveNotes}
                    className="btn btn-primary flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Notes
                  </button>
                  <button
                    onClick={handleCancelNotes}
                    className="btn btn-secondary flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className={`p-4 rounded-xl border-2 border-dashed transition-colors ${
                book.notes ? 'border-gray-200 bg-gray-50' : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50/50'
              }`}>
                {book.notes ? (
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{book.notes}</p>
                ) : (
                  <div className="text-center py-4">
                    <Bookmark className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500 font-medium">No notes yet</p>
                    <p className="text-sm text-gray-400">Tap the edit icon to add your thoughts</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Remove Book Card */}
          <div className="card p-6 border-red-100">
            <h3 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2">
              <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center">
                <Trash2 className="w-3 h-3 text-red-600" />
              </div>
              Danger Zone
            </h3>
            <p className="text-red-700 text-sm mb-4">
              Removing this book will permanently delete it from your library. This action cannot be undone.
            </p>
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

      {/* Lent Out Prompt Modal */}
      {showLentPrompt && (
        <div className="modal-overlay">
          <div className="modal-content p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Lent Out Book</h3>
              <p className="text-gray-600">
                Who did you lend <span className="font-semibold">"{book.title}"</span> to?
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Person's Name
                </label>
                <input
                  type="text"
                  value={lentToName}
                  onChange={(e) => setLentToName(e.target.value)}
                  placeholder="Enter the person's name"
                  className="input"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleLentSubmit()
                    }
                  }}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowLentPrompt(false)
                    setLentToName('')
                  }}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLentSubmit}
                  className="btn btn-primary flex-1"
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Mark as Lent
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content p-6">
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
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteBook}
                  className="btn btn-danger flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
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