'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, BookOpen, Eye, Check, ChevronRight, Scan } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useBooks } from './contexts/BookContext'
import BarcodeScanner from './components/BarcodeScanner'

interface GoogleBook {
  id: string
  volumeInfo: {
    title: string
    authors?: string[]
    imageLinks?: {
      thumbnail: string
      smallThumbnail: string
    }
    industryIdentifiers?: Array<{
      type: string
      identifier: string
    }>
    description?: string
    pageCount?: number
    publishedDate?: string
    publisher?: string
    categories?: string[]
  }
}

export default function BookTracker() {
  const router = useRouter()
  const { books, addBook, toggleBookStatus } = useBooks()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newBook, setNewBook] = useState({ 
    title: '', 
    author: '', 
    status: 'owned' as 'owned' | 'wishlist', 
    cover: '', 
    isbn: '',
    description: '',
    pageCount: undefined as number | undefined,
    publishedDate: '',
    publisher: '',
    categories: [] as string[]
  })
  const [filter, setFilter] = useState<'all' | 'owned' | 'wishlist'>('all')
  const [googleSearchTerm, setGoogleSearchTerm] = useState('')
  const [googleSearchResults, setGoogleSearchResults] = useState<GoogleBook[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchMode, setSearchMode] = useState<'manual' | 'search' | 'scan'>('search')
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)

  // Debounced Google Books search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (googleSearchTerm && searchMode === 'search') {
        searchGoogleBooks(googleSearchTerm)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [googleSearchTerm, searchMode])

  const searchGoogleBooks = async (query: string) => {
    if (!query.trim()) {
      setGoogleSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`
      )
      const data = await response.json()
      setGoogleSearchResults(data.items || [])
    } catch (error) {
      console.error('Error searching books:', error)
      setGoogleSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddBook = () => {
    if (newBook.title.trim() && newBook.author.trim()) {
      addBook({
        title: newBook.title.trim(),
        author: newBook.author.trim(),
        status: newBook.status,
        cover: newBook.cover,
        isbn: newBook.isbn,
        description: newBook.description,
        pageCount: newBook.pageCount,
        publishedDate: newBook.publishedDate,
        publisher: newBook.publisher,
        categories: newBook.categories,
        notes: ''
      })
      setNewBook({ 
        title: '', 
        author: '', 
        status: 'owned', 
        cover: '', 
        isbn: '',
        description: '',
        pageCount: undefined,
        publishedDate: '',
        publisher: '',
        categories: []
      })
      setShowAddForm(false)
      setGoogleSearchResults([])
      setGoogleSearchTerm('')
    }
  }

  const selectGoogleBook = (googleBook: GoogleBook) => {
    const authors = googleBook.volumeInfo.authors || ['Unknown Author']
    const isbn = googleBook.volumeInfo.industryIdentifiers?.find(
      id => id.type === 'ISBN_13' || id.type === 'ISBN_10'
    )?.identifier || ''
    
    setNewBook({
      title: googleBook.volumeInfo.title,
      author: authors.join(', '),
      status: newBook.status,
      cover: googleBook.volumeInfo.imageLinks?.thumbnail || '',
      isbn: isbn,
      description: googleBook.volumeInfo.description || '',
      pageCount: googleBook.volumeInfo.pageCount,
      publishedDate: googleBook.volumeInfo.publishedDate || '',
      publisher: googleBook.volumeInfo.publisher || '',
      categories: googleBook.volumeInfo.categories || []
    })
    setGoogleSearchResults([])
    setGoogleSearchTerm('')
    setSearchMode('manual')
  }

  const handleBarcodeScanned = async (scannedCode: string) => {
    setShowBarcodeScanner(false)
    
    // Clean up the scanned code (remove any non-digit characters except X for ISBN-10)
    const cleanedCode = scannedCode.replace(/[^\dX]/gi, '')
    
    if (cleanedCode.length >= 10) {
      // Search Google Books using the scanned ISBN
      try {
        const response = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanedCode}`
        )
        const data = await response.json()
        
        if (data.items && data.items.length > 0) {
          // Auto-select the first result
          selectGoogleBook(data.items[0])
        } else {
          // If no results found, set the ISBN and let user search manually
          setNewBook(prev => ({ ...prev, isbn: cleanedCode }))
          setSearchMode('manual')
          alert('Book not found in database. Please enter details manually.')
        }
      } catch (error) {
        console.error('Error searching for scanned book:', error)
        setNewBook(prev => ({ ...prev, isbn: cleanedCode }))
        setSearchMode('manual')
        alert('Error searching for book. Please enter details manually.')
      }
    } else {
      alert('Invalid barcode. Please try scanning again.')
    }
  }



  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === 'all' || book.status === filter
    return matchesSearch && matchesFilter
  })

  const ownedCount = books.filter(book => book.status === 'owned').length
  const wishlistCount = books.filter(book => book.status === 'wishlist').length

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-primary-600 text-white p-4 shadow-lg">
        <h1 className="text-xl font-bold text-center">My Book Tracker</h1>
        <div className="flex justify-center gap-4 mt-2 text-sm">
          <span>📚 Owned: {ownedCount}</span>
          <span>📖 Wishlist: {wishlistCount}</span>
        </div>
      </header>

      {/* Search and Filter */}
      <div className="p-4 bg-white border-b space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search books or authors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`btn flex-1 text-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          >
            All ({books.length})
          </button>
          <button
            onClick={() => setFilter('owned')}
            className={`btn flex-1 text-sm ${filter === 'owned' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Owned ({ownedCount})
          </button>
          <button
            onClick={() => setFilter('wishlist')}
            className={`btn flex-1 text-sm ${filter === 'wishlist' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Wishlist ({wishlistCount})
          </button>
        </div>
      </div>

      {/* Book List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredBooks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>
              {searchTerm 
                ? "No books found matching your search." 
                : books.length === 0 
                  ? "No books yet. Add your first book!" 
                  : "No books in this category."
              }
            </p>
          </div>
        ) : (
          filteredBooks.map(book => (
            <div 
              key={book.id} 
              className="bg-white border rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/book/${book.id}`)}
            >
              <div className="flex items-start gap-3">
                {book.cover && (
                  <img 
                    src={book.cover} 
                    alt={book.title}
                    className="w-12 h-16 object-cover rounded flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{book.title}</h3>
                  <p className="text-sm text-gray-600 truncate">{book.author}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      book.status === 'owned' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {book.status === 'owned' ? (
                        <>
                          <Check className="w-3 h-3" />
                          Owned
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3" />
                          Wishlist
                        </>
                      )}
                    </span>
                    <span className="text-xs text-gray-400">{book.dateAdded}</span>
                  </div>
                </div>
                <div className="flex gap-2 ml-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleBookStatus(book.id)
                    }}
                    className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                    title={`Mark as ${book.status === 'owned' ? 'wishlist' : 'owned'}`}
                  >
                    {book.status === 'owned' ? <Eye className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  </button>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Book Form */}
      {showAddForm && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-end">
          <div className="bg-white w-full rounded-t-lg p-4 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Add New Book</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Search Mode Toggle */}
            <div className="flex gap-1">
              <button
                onClick={() => {
                  setSearchMode('search')
                  setGoogleSearchResults([])
                  setShowBarcodeScanner(false)
                }}
                className={`btn flex-1 text-xs ${searchMode === 'search' ? 'btn-primary' : 'btn-secondary'}`}
              >
                🔍 Search
              </button>
              <button
                onClick={() => {
                  setSearchMode('scan')
                  setGoogleSearchResults([])
                  setGoogleSearchTerm('')
                  setShowBarcodeScanner(true)
                }}
                className={`btn flex-1 text-xs ${searchMode === 'scan' ? 'btn-primary' : 'btn-secondary'}`}
              >
                <Scan className="w-3 h-3 mr-1" />
                Scan
              </button>
              <button
                onClick={() => {
                  setSearchMode('manual')
                  setGoogleSearchResults([])
                  setGoogleSearchTerm('')
                  setShowBarcodeScanner(false)
                }}
                className={`btn flex-1 text-xs ${searchMode === 'manual' ? 'btn-primary' : 'btn-secondary'}`}
              >
                ✏️ Manual
              </button>
            </div>

            {/* Google Books Search */}
            {searchMode === 'search' && (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search for books..."
                    value={googleSearchTerm}
                    onChange={(e) => setGoogleSearchTerm(e.target.value)}
                    className="input pl-10"
                    autoFocus
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                    </div>
                  )}
                </div>

                {/* Search Results */}
                {googleSearchResults.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    <p className="text-sm text-gray-600">Tap a book to select it:</p>
                    {googleSearchResults.map((googleBook) => (
                      <div
                        key={googleBook.id}
                        onClick={() => selectGoogleBook(googleBook)}
                        className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        {googleBook.volumeInfo.imageLinks?.thumbnail && (
                          <img
                            src={googleBook.volumeInfo.imageLinks.thumbnail}
                            alt={googleBook.volumeInfo.title}
                            className="w-10 h-14 object-cover rounded flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-gray-900 truncate">
                            {googleBook.volumeInfo.title}
                          </h4>
                          <p className="text-xs text-gray-600 truncate">
                            {googleBook.volumeInfo.authors?.join(', ') || 'Unknown Author'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Scan Mode Instructions */}
            {searchMode === 'scan' && !showBarcodeScanner && (
              <div className="text-center py-8 text-gray-500">
                <Scan className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="mb-2">Camera scanner is ready</p>
                <p className="text-sm text-gray-400">
                  Tap the scan button above to open the camera and scan a book barcode
                </p>
              </div>
            )}

            {/* Manual Entry Form */}
            {searchMode === 'manual' && (
              <>
                <input
                  type="text"
                  placeholder="Book title"
                  value={newBook.title}
                  onChange={(e) => setNewBook(prev => ({ ...prev, title: e.target.value }))}
                  className="input"
                  autoFocus
                />
                
                <input
                  type="text"
                  placeholder="Author"
                  value={newBook.author}
                  onChange={(e) => setNewBook(prev => ({ ...prev, author: e.target.value }))}
                  className="input"
                />

                {newBook.isbn && (
                  <input
                    type="text"
                    placeholder="ISBN (scanned)"
                    value={newBook.isbn}
                    onChange={(e) => setNewBook(prev => ({ ...prev, isbn: e.target.value }))}
                    className="input"
                    readOnly
                  />
                )}
              </>
            )}

            {/* Book Preview (when title is filled) */}
            {newBook.title && (
              <div className="border rounded-lg p-3 bg-gray-50">
                <p className="text-sm font-medium text-gray-700">Preview:</p>
                <div className="flex items-start gap-3 mt-2">
                  {newBook.cover && (
                    <img 
                      src={newBook.cover} 
                      alt={newBook.title}
                      className="w-10 h-14 object-cover rounded flex-shrink-0"
                    />
                  )}
                  <div>
                    <p className="font-medium text-sm">{newBook.title}</p>
                    <p className="text-xs text-gray-600">{newBook.author}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Status Selection */}
            <div className="flex gap-2">
              <button
                onClick={() => setNewBook(prev => ({ ...prev, status: 'owned' }))}
                className={`btn flex-1 ${newBook.status === 'owned' ? 'btn-primary' : 'btn-secondary'}`}
              >
                <Check className="w-4 h-4 mr-1" />
                I Own This
              </button>
              <button
                onClick={() => setNewBook(prev => ({ ...prev, status: 'wishlist' }))}
                className={`btn flex-1 ${newBook.status === 'wishlist' ? 'btn-primary' : 'btn-secondary'}`}
              >
                <Eye className="w-4 h-4 mr-1" />
                Wishlist
              </button>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <button 
                                 onClick={() => {
                   setShowAddForm(false)
                   setShowBarcodeScanner(false)
                   setNewBook({ 
                     title: '', 
                     author: '', 
                     status: 'owned', 
                     cover: '', 
                     isbn: '',
                     description: '',
                     pageCount: undefined,
                     publishedDate: '',
                     publisher: '',
                     categories: []
                   })
                   setGoogleSearchResults([])
                   setGoogleSearchTerm('')
                 }} 
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddBook} 
                className="btn btn-primary flex-1"
                disabled={!newBook.title.trim() || !newBook.author.trim()}
              >
                Add Book
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Add Button */}
      <button
        onClick={() => {
          setShowAddForm(true)
          setSearchMode('search')
          setGoogleSearchResults([])
          setGoogleSearchTerm('')
          setShowBarcodeScanner(false)
        }}
        className="fixed bottom-6 right-6 bg-primary-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-primary-700 transition-colors"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Barcode Scanner */}
      <BarcodeScanner
        isActive={showBarcodeScanner}
        onScan={handleBarcodeScanned}
        onClose={() => {
          setShowBarcodeScanner(false)
          setSearchMode('search')
        }}
      />
    </div>
  )
} 