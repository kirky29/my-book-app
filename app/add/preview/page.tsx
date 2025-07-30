'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Plus, BookOpen, Calendar, User, Hash, Globe, FileText, Building, ChevronDown, ChevronUp } from 'lucide-react'
import { useBooks } from '../../contexts/BookContext'
import { useStatusOptions } from '../../contexts/StatusOptionsContext'
import { useAuth } from '../../contexts/AuthContext'
import { useTags } from '../../contexts/TagsContext'
import StatusSelector from '../../components/StatusSelector'
import TagSelector from '../../components/TagSelector'
import SimilarBooksModal from '../../components/SimilarBooksModal'

interface BookPreview {
  title: string
  author: string
  isbn?: string
  cover?: string
  publisher?: string
  publishedDate?: string
  pageCount?: number
  language?: string
  description?: string
}

export default function BookPreview() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addBook, findSimilarBooks } = useBooks()
  const { statusOptions } = useStatusOptions()
  const { user } = useAuth()
  const { tags } = useTags()
  
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showStatusSelector, setShowStatusSelector] = useState(false)
  const [showSimilarBooksModal, setShowSimilarBooksModal] = useState(false)
  const [similarBooks, setSimilarBooks] = useState<any[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

  // Set default status when status options are loaded
  useEffect(() => {
    if (statusOptions.length > 0 && !selectedStatus) {
      // Find the first default status or use the first available status
      const defaultStatus = statusOptions.find(option => option.isDefault) || statusOptions[0]
      setSelectedStatus(defaultStatus.id)
    }
  }, [statusOptions, selectedStatus])

  // Get book data from URL params
  const bookData: BookPreview = {
    title: searchParams.get('title') || '',
    author: searchParams.get('author') || '',
    isbn: searchParams.get('isbn') || undefined,
    cover: searchParams.get('cover') || undefined,
    publisher: searchParams.get('publisher') || undefined,
    publishedDate: searchParams.get('publishedDate') || undefined,
    pageCount: searchParams.get('pageCount') ? parseInt(searchParams.get('pageCount')!) : undefined,
    language: searchParams.get('language') || undefined,
    description: searchParams.get('description') || undefined
  }

  // Check for similar books
  const checkForSimilarBooks = (title: string, author: string, isbn?: string, publisher?: string) => {
    const similarBooks = findSimilarBooks(title, author, isbn, publisher)
    
    if (similarBooks.length > 0) {
      setSimilarBooks(similarBooks)
      setShowSimilarBooksModal(true)
      return true
    }
    
    return false
  }

  // Handle adding book
  const handleAddBook = async () => {
    if (!bookData.title.trim() || !bookData.author.trim()) {
      alert('Please enter both title and author.')
      return
    }

    // Check for similar books before adding
    const hasSimilarBooks = checkForSimilarBooks(
      bookData.title.trim(), 
      bookData.author.trim(), 
      bookData.isbn, 
      bookData.publisher
    )
    
    if (hasSimilarBooks) {
      return
    }

    console.log('User authenticated:', !!user)
    console.log('Book data:', bookData)
    console.log('Selected status:', selectedStatus)
    
    setIsAdding(true)
    try {
      // Filter out undefined values to prevent Firebase errors
      const bookToAdd = {
        title: bookData.title.trim(),
        author: bookData.author.trim(),
        status: selectedStatus,
        ...(bookData.isbn && { isbn: bookData.isbn }),
        ...(bookData.cover && { cover: bookData.cover }),
        ...(bookData.publisher && { publisher: bookData.publisher }),
        ...(bookData.publishedDate && { publishedDate: bookData.publishedDate }),
        ...(bookData.pageCount && { pageCount: bookData.pageCount }),
        ...(bookData.language && { language: bookData.language }),
        ...(bookData.description && { description: bookData.description }),
        ...(selectedTags.length > 0 && { tagIds: selectedTags })
      }
      
      console.log('Adding book with data:', bookToAdd)
      console.log('User authenticated:', !!user)
      
      await addBook(bookToAdd)
      
      router.push('/')
    } catch (error) {
      console.error('Error adding book:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      alert(`Failed to add book: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsAdding(false)
    }
  }

  // Handle adding book after similar books check
  const handleAddAnyway = async () => {
    setIsAdding(true)
    try {
      // Filter out undefined values to prevent Firebase errors
      const bookToAdd = {
        title: bookData.title.trim(),
        author: bookData.author.trim(),
        status: selectedStatus,
        ...(bookData.isbn && { isbn: bookData.isbn }),
        ...(bookData.cover && { cover: bookData.cover }),
        ...(bookData.publisher && { publisher: bookData.publisher }),
        ...(bookData.publishedDate && { publishedDate: bookData.publishedDate }),
        ...(bookData.pageCount && { pageCount: bookData.pageCount }),
        ...(bookData.language && { language: bookData.language }),
        ...(bookData.description && { description: bookData.description }),
        ...(selectedTags.length > 0 && { tagIds: selectedTags })
      }
      
      await addBook(bookToAdd)
      
      setShowSimilarBooksModal(false)
      router.push('/')
    } catch (error) {
      console.error('Error adding book:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      alert(`Failed to add book: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsAdding(false)
    }
  }

  const handleCloseSimilarBooksModal = () => {
    setShowSimilarBooksModal(false)
  }

  // Get status info for display
  const getStatusInfo = (statusId: string) => {
    const status = statusOptions.find(s => s.id === statusId)
    return status || { name: 'Unknown', color: 'gray', icon: '❓' }
  }

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  // Helper function to truncate description to first 5 lines
  const truncateDescription = (description: string, expanded: boolean) => {
    if (expanded) return description
    
    // Estimate 5 lines worth of characters (approximately 300-400 characters)
    const maxChars = 300
    if (description.length <= maxChars) return description
    
    // Find a good breaking point (end of sentence or word)
    const truncated = description.substring(0, maxChars)
    const lastPeriod = truncated.lastIndexOf('.')
    const lastSpace = truncated.lastIndexOf(' ')
    
    // Prefer breaking at end of sentence, then at word boundary
    const breakPoint = lastPeriod > maxChars * 0.7 ? lastPeriod + 1 : lastSpace > maxChars * 0.8 ? lastSpace : maxChars
    
    return description.substring(0, breakPoint) + '...'
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
          <h1 className="text-lg sm:text-xl font-semibold">Book Preview</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Book Cover and Basic Info */}
          <div className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex gap-6">
              {/* Book Cover */}
              <div className="flex-shrink-0">
                {bookData.cover ? (
                  <img 
                    src={bookData.cover} 
                    alt={bookData.title}
                    className="w-32 h-48 sm:w-40 sm:h-60 object-cover rounded-lg shadow-md"
                  />
                ) : (
                  <div className="w-32 h-48 sm:w-40 sm:h-60 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center shadow-md">
                    <BookOpen className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Book Details */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{bookData.title}</h2>
                <p className="text-lg text-gray-600 mb-4">by {bookData.author}</p>
                
                {/* Quick Stats */}
                <div className="space-y-2">
                  {bookData.publishedDate && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Published: {formatDate(bookData.publishedDate)}</span>
                    </div>
                  )}
                  {bookData.pageCount && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="w-4 h-4" />
                      <span>{bookData.pageCount} pages</span>
                    </div>
                  )}
                  {bookData.publisher && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building className="w-4 h-4" />
                      <span>{bookData.publisher}</span>
                    </div>
                  )}
                  {bookData.language && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Globe className="w-4 h-4" />
                      <span>{bookData.language}</span>
                    </div>
                  )}
                  {bookData.isbn && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Hash className="w-4 h-4" />
                      <span>ISBN: {bookData.isbn}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Book Description */}
          {bookData.description && (
            <div className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Description</h3>
                {bookData.description && bookData.description.length > 300 && (
                  <button
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    {isDescriptionExpanded ? (
                      <>
                        <span>Show Less</span>
                        <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <span>Show More</span>
                        <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {truncateDescription(bookData.description, isDescriptionExpanded)}
              </div>
            </div>
          )}

          {/* Add to Library Section */}
          <div className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add to Library</h3>
            
            {/* Status Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Book Status</label>
              <button
                onClick={() => setShowStatusSelector(true)}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getStatusInfo(selectedStatus).icon}</span>
                  <span className="font-medium text-gray-900">{getStatusInfo(selectedStatus).name}</span>
                </div>
                <span className="text-gray-400">Change</span>
              </button>
            </div>

            {/* Tag Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Tags (Optional)</label>
              <TagSelector
                selectedTagIds={selectedTags}
                onTagsChange={setSelectedTags}
                className="w-full"
              />
            </div>

            {/* Add Button */}
            <button
              onClick={handleAddBook}
              disabled={isAdding || !selectedStatus}
              className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-0.5 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isAdding ? (
                <>
                  <div className="spinner h-5 w-5"></div>
                  <span>Adding to Library...</span>
                </>
              ) : !selectedStatus ? (
                <>
                  <div className="spinner h-5 w-5"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Add to Library</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Status Selector Modal */}
      {showStatusSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Select Book Status</h3>
                <button
                  onClick={() => setShowStatusSelector(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
              
              <div className="space-y-2 mb-6">
                {statusOptions.map((status) => (
                  <button
                    key={status.id}
                    onClick={() => {
                      setSelectedStatus(status.id)
                      setShowStatusSelector(false)
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      selectedStatus === status.id
                        ? 'bg-blue-50 border-blue-200 text-blue-900'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg">{status.icon}</span>
                    <span className="font-medium">{status.name}</span>
                    {selectedStatus === status.id && (
                      <span className="text-blue-600 ml-auto">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Similar Books Modal */}
      <SimilarBooksModal
        isOpen={showSimilarBooksModal}
        onClose={handleCloseSimilarBooksModal}
        onAddAnyway={handleAddAnyway}
        similarBooks={similarBooks}
        newBookTitle={bookData.title}
        newBookAuthor={bookData.author}
      />
    </div>
  )
} 