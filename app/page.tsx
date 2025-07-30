'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Camera, BookOpen, Check, Heart, X, Settings } from 'lucide-react'
import { useBooks } from './contexts/BookContext'
import BarcodeScanner from './components/BarcodeScanner'
import SimilarBooksModal from './components/SimilarBooksModal'

interface Book {
  id: string
  title: string
  author: string
  status: 'owned' | 'wishlist'
  cover?: string
  isbn?: string
  dateAdded: string
  publisher?: string
  publishedDate?: string
  pageCount?: number
  language?: string
  edition?: string
}

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
  }
}

export default function BookTracker() {
  const router = useRouter()
  const { books, addBook, loading, findSimilarBooks } = useBooks()
  const [searchTerm, setSearchTerm] = useState('')
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchResults, setSearchResults] = useState<GoogleBook[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [newBook, setNewBook] = useState({ 
    title: '', 
    author: '', 
    isbn: '', 
    cover: '', 
    publisher: '',
    publishedDate: '',
    pageCount: undefined as number | undefined,
    language: ''
  })
  const [newBookStatus, setNewBookStatus] = useState<'owned' | 'wishlist'>('owned')
  const [showSimilarBooksModal, setShowSimilarBooksModal] = useState(false)
  const [similarBooks, setSimilarBooks] = useState<any[]>([])
  const [pendingBook, setPendingBook] = useState<any>(null)

  // Search Google Books API
  const searchGoogleBooks = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`
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
      searchGoogleBooks(searchTerm)
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
          
          // Check for similar books before showing add form
          const hasSimilarBooks = checkForSimilarBooks(title, author, cleanedCode, book.volumeInfo.publisher)
          
          if (hasSimilarBooks) {
            setPendingBook({
              title: title,
              author: author,
              isbn: cleanedCode,
              cover: book.volumeInfo.imageLinks?.thumbnail || '',
              publisher: book.volumeInfo.publisher || '',
              publishedDate: book.volumeInfo.publishedDate || '',
              pageCount: book.volumeInfo.pageCount,
              language: book.volumeInfo.language || ''
            })
            return
          }
          
          setNewBook({
            title: title,
            author: author,
            isbn: cleanedCode,
            cover: book.volumeInfo.imageLinks?.thumbnail || '',
            publisher: book.volumeInfo.publisher || '',
            publishedDate: book.volumeInfo.publishedDate || '',
            pageCount: book.volumeInfo.pageCount,
            language: book.volumeInfo.language || ''
          })
          setNewBookStatus('owned') // Reset to default
          setShowBarcodeScanner(false) // Close scanner
          // Keep add book modal open with populated info
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

  // Reset form
  const resetForm = () => {
    setNewBook({ 
      title: '', 
      author: '', 
      isbn: '', 
      cover: '', 
      publisher: '',
      publishedDate: '',
      pageCount: undefined,
      language: ''
    })
    setNewBookStatus('owned')
    setShowAddForm(false)
    setShowBarcodeScanner(false)
    setSearchResults([])
    setSearchTerm('')
  }

  // Add book to library
  const handleAddBook = async () => {
    if (!newBook.title.trim() || !newBook.author.trim()) {
      alert('Please enter both title and author.')
      return
    }

    // Check for similar books before adding
    const hasSimilarBooks = checkForSimilarBooks(
      newBook.title.trim(), 
      newBook.author.trim(), 
      newBook.isbn, 
      newBook.publisher
    )
    
    if (hasSimilarBooks) {
      setPendingBook(newBook)
      return
    }

    try {
      await addBook({
        title: newBook.title.trim(),
        author: newBook.author.trim(),
        status: newBookStatus,
        isbn: newBook.isbn,
        cover: newBook.cover,
        publisher: newBook.publisher,
        publishedDate: newBook.publishedDate,
        pageCount: newBook.pageCount,
        language: newBook.language
      })
      
      resetForm()
    } catch (error) {
      console.error('Error adding book:', error)
      alert('Failed to add book. Please try again.')
    }
  }

  // Enhanced duplicate detection using the new system
  const checkForSimilarBooks = (title: string, author: string, isbn?: string, publisher?: string) => {
    const similarBooks = findSimilarBooks(title, author, isbn, publisher)
    
    if (similarBooks.length > 0) {
      setSimilarBooks(similarBooks)
      setShowSimilarBooksModal(true)
      return true // Similar books found
    }
    
    return false // No similar books found
  }

  // Handle adding book after similar books check
  const handleAddAnyway = async () => {
    if (!pendingBook) return
    
    try {
      await addBook({
        title: pendingBook.title.trim(),
        author: pendingBook.author.trim(),
        status: newBookStatus,
        isbn: pendingBook.isbn,
        cover: pendingBook.cover,
        publisher: pendingBook.publisher,
        publishedDate: pendingBook.publishedDate,
        pageCount: pendingBook.pageCount,
        language: pendingBook.language
      })
      
      setShowSimilarBooksModal(false)
      setPendingBook(null)
      resetForm()
    } catch (error) {
      console.error('Error adding book:', error)
      alert('Failed to add book. Please try again.')
    }
  }

  const handleCloseSimilarBooksModal = () => {
    setShowSimilarBooksModal(false)
    setPendingBook(null)
  }

  // Select book from search results
  const selectBook = (book: GoogleBook) => {
    const authors = book.volumeInfo.authors || ['Unknown Author']
    const isbn = book.volumeInfo.industryIdentifiers?.find(
      id => id.type === 'ISBN_13' || id.type === 'ISBN_10'
    )?.identifier || ''
    const title = book.volumeInfo.title || 'Unknown Title'
    const author = authors.join(', ')
    
    // Check for similar books before showing add form
    const hasSimilarBooks = checkForSimilarBooks(title, author, isbn, book.volumeInfo.publisher)
    
    if (hasSimilarBooks) {
      setPendingBook({
        title: title,
        author: author,
        isbn: isbn,
        cover: book.volumeInfo.imageLinks?.thumbnail || '',
        publisher: book.volumeInfo.publisher || '',
        publishedDate: book.volumeInfo.publishedDate || '',
        pageCount: book.volumeInfo.pageCount,
        language: book.volumeInfo.language || ''
      })
      return
    }
    
    setNewBook({
      title: title,
      author: author,
      isbn: isbn,
      cover: book.volumeInfo.imageLinks?.thumbnail || '',
      publisher: book.volumeInfo.publisher || '',
      publishedDate: book.volumeInfo.publishedDate || '',
      pageCount: book.volumeInfo.pageCount,
      language: book.volumeInfo.language || ''
    })
    setNewBookStatus('owned') // Reset to default
    setShowAddForm(true)
    setSearchResults([])
    setSearchTerm('')
  }

  // Filter books for search
  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const ownedCount = books.filter(book => book.status === 'owned').length
  const wishlistCount = books.filter(book => book.status === 'wishlist').length

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white safe-area-top">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Book Tracker</h1>
              <p className="text-blue-100 text-sm sm:text-base">Do I own this book?</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddForm(true)}
                className="p-3 sm:p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                title="Add Book"
              >
                <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={() => router.push('/settings')}
                className="p-3 sm:p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="mt-4 flex items-center gap-3 sm:gap-4">
            <div className="bg-white/10 rounded-xl p-3 sm:p-4 text-center flex-1">
              <div className="text-xl sm:text-2xl font-bold">{ownedCount}</div>
              <div className="text-xs sm:text-sm text-blue-100">Books Owned</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 sm:p-4 text-center flex-1">
              <div className="text-xl sm:text-2xl font-bold">{wishlistCount}</div>
              <div className="text-xs sm:text-sm text-blue-100">Wishlist</div>
            </div>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <div className="px-4 sm:px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by title or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 sm:py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="spinner h-12 w-12 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your library...</p>
          </div>
        ) : searchTerm ? (
          // Search Results
          <div className="space-y-4">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
              {isSearching ? 'Searching...' : 'Search Results'}
            </h3>
            
            {/* Google Books Results */}
            {searchResults.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm sm:text-base font-medium text-gray-700">Add to Library:</h4>
                {searchResults.map((book) => {
                  const authors = book.volumeInfo.authors || ['Unknown Author']
                  const isbn = book.volumeInfo.industryIdentifiers?.find(
                    id => id.type === 'ISBN_13' || id.type === 'ISBN_10'
                  )?.identifier || ''
                  const title = book.volumeInfo.title || 'Unknown Title'
                  const author = authors.join(', ')
                  
                  // Check if this book is already in library
                  const existingBook = books.find(book => 
                    (book.isbn && book.isbn.replace(/[^\dX]/gi, '') === isbn.replace(/[^\dX]/gi, '')) ||
                    (book.title.toLowerCase() === title.toLowerCase() && book.author.toLowerCase() === author.toLowerCase())
                  )
                  
                  return (
                    <div 
                      key={book.id}
                      onClick={() => selectBook(book)}
                      className={`rounded-xl p-4 sm:p-5 shadow-sm border cursor-pointer hover:shadow-md transition-shadow ${
                        existingBook 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex gap-4">
                        {book.volumeInfo.imageLinks?.thumbnail ? (
                          <img 
                            src={book.volumeInfo.imageLinks.thumbnail} 
                            alt={book.volumeInfo.title}
                            className="w-16 h-24 sm:w-20 sm:h-28 object-cover rounded-lg flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-24 sm:w-20 sm:h-28 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{book.volumeInfo.title}</h5>
                            {existingBook && (
                              <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex-shrink-0">
                                <Check className="w-3 h-3 mr-1" />
                                Owned
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2 truncate">
                            {book.volumeInfo.authors?.join(', ') || 'Unknown Author'}
                          </p>
                          <button className={`text-sm font-medium ${
                            existingBook 
                              ? 'text-green-600 hover:text-green-700' 
                              : 'text-blue-600 hover:text-blue-700'
                          }`}>
                            {existingBook ? 'Already in Library' : 'Add to Library'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Your Library Results */}
            {filteredBooks.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm sm:text-base font-medium text-gray-700">In Your Library:</h4>
                {filteredBooks.map((book) => (
                  <div 
                    key={book.id}
                    onClick={() => router.push(`/book/${book.id}`)}
                    className="bg-green-50 border border-green-200 rounded-xl p-4 sm:p-5 cursor-pointer hover:bg-green-100 hover:border-green-300 transition-all"
                  >
                    <div className="flex gap-4">
                      {book.cover ? (
                        <img 
                          src={book.cover} 
                          alt={book.title}
                          className="w-16 h-24 sm:w-20 sm:h-28 object-cover rounded-lg flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-24 sm:w-20 sm:h-28 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-6 h-6 text-green-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <h5 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{book.title}</h5>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 truncate">{book.author}</p>
                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          ✓ You own this
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isSearching && searchResults.length === 0 && filteredBooks.length === 0 && (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600">No books found</p>
                <p className="text-sm text-gray-500">Try a different search term</p>
              </div>
            )}
          </div>
        ) : (
          // Library View
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Your Library</h3>
            </div>

            {books.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Your Library</h3>
                <p className="text-gray-600 mb-6">Add your first book to get started</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="btn btn-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Book
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {books.map((book) => (
                  <div 
                    key={book.id}
                    onClick={() => router.push(`/book/${book.id}`)}
                    className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all"
                  >
                    <div className="flex gap-4">
                      {book.cover ? (
                        <img 
                          src={book.cover} 
                          alt={book.title}
                          className="w-16 h-24 sm:w-20 sm:h-28 object-cover rounded-lg flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-24 sm:w-20 sm:h-28 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base truncate">{book.title}</h5>
                        <p className="text-sm text-gray-600 mb-2 truncate">{book.author}</p>
                        <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                          book.status === 'owned' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {book.status === 'owned' ? '✓ Owned' : '❤️ Wishlist'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Book Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Add Book</h3>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Barcode Scanner Option */}
              <div className="mb-6">
                <button
                  onClick={() => setShowBarcodeScanner(true)}
                  className="w-full flex items-center justify-center gap-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <Camera className="w-6 h-6 text-blue-600" />
                  <span className="font-medium text-blue-800">Scan Book Barcode</span>
                </button>
                <p className="text-sm text-gray-500 text-center mt-2">Quickest way to add a book</p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or add manually</span>
                </div>
              </div>

              <div className="space-y-4 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    value={newBook.title}
                    onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                    placeholder="Book title"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Author *</label>
                  <input
                    type="text"
                    value={newBook.author}
                    onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                    placeholder="Author name"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ISBN (optional)</label>
                  <input
                    type="text"
                    value={newBook.isbn}
                    onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
                    placeholder="ISBN number"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  />
                </div>

                {newBook.cover && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cover</label>
                    <img 
                      src={newBook.cover} 
                      alt="Book cover"
                      className="w-20 h-30 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewBookStatus('owned')}
                      className={`flex-1 py-3 px-4 rounded-lg border transition-colors text-sm font-medium ${
                        newBookStatus === 'owned'
                          ? 'bg-blue-100 border-blue-300 text-blue-800'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      ✓ Owned
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewBookStatus('wishlist')}
                      className={`flex-1 py-3 px-4 rounded-lg border transition-colors text-sm font-medium ${
                        newBookStatus === 'wishlist'
                          ? 'bg-amber-100 border-amber-300 text-amber-800'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      ❤️ Wishlist
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={resetForm}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddBook}
                    className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Add Book
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScanned}
          onClose={() => setShowBarcodeScanner(false)}
          isActive={showBarcodeScanner}
        />
      )}

      {/* Similar Books Modal */}
      <SimilarBooksModal
        isOpen={showSimilarBooksModal}
        onClose={handleCloseSimilarBooksModal}
        onAddAnyway={handleAddAnyway}
        similarBooks={similarBooks}
        newBookTitle={pendingBook?.title || ''}
        newBookAuthor={pendingBook?.author || ''}
      />
    </div>
  )
} 