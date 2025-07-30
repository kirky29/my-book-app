'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search, Camera, Plus, BookOpen, X, CheckCircle } from 'lucide-react'
import { useBooks } from '../contexts/BookContext'
import { useStatusOptions } from '../contexts/StatusOptionsContext'
import BarcodeScanner from '../components/BarcodeScanner'

interface GoogleBook {
  id: string
  volumeInfo: {
    title: string
    authors?: string[]
    imageLinks?: {
      thumbnail: string
    }
    industryIdentifiers?: Array<{
      type: string
      identifier: string
    }>
    publisher?: string
    publishedDate?: string
    pageCount?: number
    language?: string
    description?: string
  }
}

export default function AddBook() {
  const router = useRouter()
  const { statusOptions } = useStatusOptions()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<GoogleBook[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [showStatusSelector, setShowStatusSelector] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>('physical-owned')

  const [showManualEntry, setShowManualEntry] = useState(false)
  const [manualBook, setManualBook] = useState({
    title: '',
    author: '',
    isbn: '',
    publisher: '',
    publishedDate: '',
    pageCount: undefined as number | undefined,
    language: '',
    description: ''
  })

  // Search Google Books API
  const searchGoogleBooks = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`
      )
      const data = await response.json()
      setSearchResults(data.items || [])
    } catch (error) {
      console.error('Error searching books:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        searchGoogleBooks(searchTerm)
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Handle barcode scan
  const handleBarcodeScanned = async (scannedCode: string) => {
    setShowBarcodeScanner(false)
    
    const cleanedCode = scannedCode.replace(/[^\dX]/gi, '')
    
    if (cleanedCode.length >= 10) {
      try {
        const response = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanedCode}`
        )
        const data = await response.json()
        
        if (data.items && data.items.length > 0) {
          const book = data.items[0]
          const authors = book.volumeInfo.authors || ['Unknown Author']
          const title = book.volumeInfo.title || 'Unknown Title'
          const author = authors.join(', ')
          
          // Navigate to preview page with book data
          const params = new URLSearchParams({
            title: title,
            author: author,
            isbn: cleanedCode,
            cover: book.volumeInfo.imageLinks?.thumbnail || '',
            publisher: book.volumeInfo.publisher || '',
            publishedDate: book.volumeInfo.publishedDate || '',
            pageCount: book.volumeInfo.pageCount?.toString() || '',
            language: book.volumeInfo.language || '',
            description: book.volumeInfo.description || ''
          })
          
          router.push(`/add/preview?${params.toString()}`)
        } else {
          alert('Book not found. Please search manually.')
        }
      } catch (error) {
        console.error('Error searching for scanned book:', error)
        alert('Error searching for book. Please try again.')
      }
    } else {
      alert('Invalid barcode. Please try scanning again.')
    }
  }



  // Select book from search results
  const selectBook = (book: GoogleBook) => {
    const authors = book.volumeInfo.authors || ['Unknown Author']
    const isbn = book.volumeInfo.industryIdentifiers?.find(
      id => id.type === 'ISBN_13' || id.type === 'ISBN_10'
    )?.identifier || ''
    const title = book.volumeInfo.title || 'Unknown Title'
    const author = authors.join(', ')
    
    // Navigate to preview page with book data
    const params = new URLSearchParams({
      title: title,
      author: author,
      isbn: isbn,
      cover: book.volumeInfo.imageLinks?.thumbnail || '',
      publisher: book.volumeInfo.publisher || '',
      publishedDate: book.volumeInfo.publishedDate || '',
      pageCount: book.volumeInfo.pageCount?.toString() || '',
      language: book.volumeInfo.language || '',
      description: book.volumeInfo.description || ''
    })
    
    router.push(`/add/preview?${params.toString()}`)
  }

  // Handle manual book entry
  const handleManualEntry = () => {
    setShowManualEntry(true)
    setManualBook({
      title: searchTerm || '', // Pre-fill with search term if available, otherwise empty
      author: '',
      isbn: '',
      publisher: '',
      publishedDate: '',
      pageCount: undefined,
      language: '',
      description: ''
    })
  }

  // Handle adding manual book
  const handleAddManualBook = () => {
    if (!manualBook.title.trim() || !manualBook.author.trim()) {
      alert('Please enter both title and author.')
      return
    }

    // Navigate to preview page with manual book data
    const params = new URLSearchParams({
      title: manualBook.title.trim(),
      author: manualBook.author.trim(),
      isbn: manualBook.isbn,
      cover: '',
      publisher: manualBook.publisher,
      publishedDate: manualBook.publishedDate,
      pageCount: manualBook.pageCount?.toString() || '',
      language: manualBook.language,
      description: manualBook.description
    })
    
    router.push(`/add/preview?${params.toString()}`)
  }

  // Get status info for display
  const getStatusInfo = (statusId: string) => {
    const status = statusOptions.find(s => s.id === statusId)
    return status || { name: 'Unknown', color: 'gray', icon: '❓' }
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
          <h1 className="text-lg sm:text-xl font-semibold">Add Book</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Add</h3>
            
            {/* Barcode Scanner */}
            <button
              onClick={() => setShowBarcodeScanner(true)}
              className="w-full flex items-center justify-center gap-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl hover:bg-blue-100 transition-colors mb-3"
            >
              <Camera className="w-6 h-6 text-blue-600" />
              <span className="font-medium text-blue-800">Scan Book Barcode</span>
            </button>
            <p className="text-sm text-gray-500 text-center mb-4">Quickest way to add a book</p>
            
            {/* Manual Add Button */}
            <button
              onClick={handleManualEntry}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-sm"
            >
              <Plus className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Manually Add a Book</span>
            </button>
          </div>

          {/* Search Section */}
          <div className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Search for Books</h3>
            
            {/* Search Input */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, author, or ISBN..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
              />
            </div>

            {/* Status Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Book Status</label>
              <button
                onClick={() => setShowStatusSelector(true)}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getStatusInfo(selectedStatus).icon}</span>
                  <span className="font-medium text-gray-900">{getStatusInfo(selectedStatus).name}</span>
                </div>
                <span className="text-gray-400">Change</span>
              </button>
            </div>

            {/* Search Results */}
            {isSearching && (
              <div className="text-center py-8">
                <div className="spinner h-8 w-8 mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm">Searching for books...</p>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Search Results:</h4>
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {searchResults.map((book) => (
                    <div 
                      key={book.id}
                      onClick={() => selectBook(book)}
                      className="bg-white border border-gray-200 rounded-xl p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex gap-4">
                        {book.volumeInfo.imageLinks?.thumbnail ? (
                          <img 
                            src={book.volumeInfo.imageLinks.thumbnail} 
                            alt={book.volumeInfo.title}
                            className="w-16 h-24 object-cover rounded-lg flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-gray-900 mb-1 text-sm truncate">{book.volumeInfo.title}</h5>
                          <p className="text-sm text-gray-600 mb-2 truncate">
                            {book.volumeInfo.authors?.join(', ') || 'Unknown Author'}
                          </p>
                          {book.volumeInfo.publishedDate && (
                            <p className="text-xs text-gray-500">
                              Published: {book.volumeInfo.publishedDate}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                              Add to Library
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchTerm && !isSearching && searchResults.length === 0 && (
              <div className="space-y-4">
                <div className="text-center py-6">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-2">No books found in search results.</p>
                  <p className="text-sm text-gray-500">You can add the book manually instead.</p>
                </div>
                
                {/* Manual Book Entry */}
                <div 
                  onClick={handleManualEntry}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-24 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Plus className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold text-gray-900 mb-1 text-sm">Add Book Manually</h5>
                      <p className="text-sm text-gray-600 mb-2">Enter book details yourself</p>
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                        Manual Entry
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Manual Entry Form */}
          {showManualEntry && (
            <div className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Add Book Manually</h3>
                <button
                  onClick={() => setShowManualEntry(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    value={manualBook.title}
                    onChange={(e) => setManualBook({ ...manualBook, title: e.target.value })}
                    placeholder="Book title"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Author *</label>
                  <input
                    type="text"
                    value={manualBook.author}
                    onChange={(e) => setManualBook({ ...manualBook, author: e.target.value })}
                    placeholder="Author name"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ISBN (Optional)</label>
                  <input
                    type="text"
                    value={manualBook.isbn}
                    onChange={(e) => setManualBook({ ...manualBook, isbn: e.target.value })}
                    placeholder="ISBN number"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Publisher (Optional)</label>
                  <input
                    type="text"
                    value={manualBook.publisher}
                    onChange={(e) => setManualBook({ ...manualBook, publisher: e.target.value })}
                    placeholder="Publisher name"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Published Date (Optional)</label>
                  <input
                    type="text"
                    value={manualBook.publishedDate}
                    onChange={(e) => setManualBook({ ...manualBook, publishedDate: e.target.value })}
                    placeholder="e.g., 2023, January 2023"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Page Count (Optional)</label>
                  <input
                    type="number"
                    value={manualBook.pageCount || ''}
                    onChange={(e) => setManualBook({ ...manualBook, pageCount: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="Number of pages"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Language (Optional)</label>
                  <input
                    type="text"
                    value={manualBook.language}
                    onChange={(e) => setManualBook({ ...manualBook, language: e.target.value })}
                    placeholder="e.g., English, Spanish"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                  <textarea
                    value={manualBook.description}
                    onChange={(e) => setManualBook({ ...manualBook, description: e.target.value })}
                    placeholder="Book description or summary"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowManualEntry(false)}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddManualBook}
                    className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Add Book
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Scan Barcode</h3>
                <button
                  onClick={() => setShowBarcodeScanner(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <BarcodeScanner 
                onScan={handleBarcodeScanned} 
                onClose={() => setShowBarcodeScanner(false)}
                isActive={showBarcodeScanner}
              />
            </div>
          </div>
        </div>
      )}

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
                  <X className="w-5 h-5" />
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
                      <CheckCircle className="w-5 h-5 text-blue-600 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  )
} 