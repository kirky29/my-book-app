'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, BookOpen, Eye, Check, ChevronRight, Scan, LogOut, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useBooks } from './contexts/BookContext'
import { useAuth } from './contexts/AuthContext'
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
  const { books, addBook, toggleBookStatus, loading } = useBooks()
  const { user, logout } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newBook, setNewBook] = useState({ 
    title: '', 
    author: '', 
    status: 'physical' as 'physical' | 'digital' | 'both' | 'read' | 'wishlist', 
    cover: '', 
    isbn: '',
    description: '',
    pageCount: undefined as number | undefined,
    publishedDate: '',
    publisher: '',
    categories: [] as string[]
  })
  const [filter, setFilter] = useState<'all' | 'owned' | 'wishlist' | 'read'>('all')
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

  const handleAddBook = async () => {
    if (newBook.title.trim() && newBook.author.trim()) {
      try {
        await addBook({
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
          status: 'physical', 
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
      } catch (error) {
        console.error('Error adding book:', error)
        alert('Failed to add book. Please try again.')
      }
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
    
    let matchesFilter = false
    if (filter === 'all') {
      matchesFilter = true
    } else if (filter === 'owned') {
      matchesFilter = ['physical', 'digital', 'both'].includes(book.status)
    } else {
      matchesFilter = book.status === filter
    }
    
    return matchesSearch && matchesFilter
  })

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/auth')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const ownedCount = books.filter(book => ['physical', 'digital', 'both'].includes(book.status)).length
  const wishlistCount = books.filter(book => book.status === 'wishlist').length
  const readCount = books.filter(book => book.status === 'read').length

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-primary-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            <span className="text-sm font-medium">
              {user?.displayName || user?.email || 'User'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-primary-700 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
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
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-3"></div>
            <p>Loading your books...</p>
          </div>
        ) : filteredBooks.length === 0 ? (
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
                      ['physical', 'digital', 'both'].includes(book.status)
                        ? 'bg-green-100 text-green-800' 
                        : book.status === 'read'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {book.status === 'physical' && (
                        <>
                          <Check className="w-3 h-3" />
                          📚 Physical
                        </>
                      )}
                      {book.status === 'digital' && (
                        <>
                          <Check className="w-3 h-3" />
                          📱 Digital
                        </>
                      )}
                      {book.status === 'both' && (
                        <>
                          <Check className="w-3 h-3" />
                          📚📱 Both
                        </>
                      )}
                      {book.status === 'read' && (
                        <>
                          <Check className="w-3 h-3" />
                          ✅ Read
                        </>
                      )}
                      {book.status === 'wishlist' && (
                        <>
                          <Eye className="w-3 h-3" />
                          🔖 Wishlist
                        </>
                      )}
                    </span>
                    <span className="text-xs text-gray-400">{book.dateAdded}</span>
                  </div>
                </div>
                <div className="flex gap-2 ml-3">
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
          <div className="bg-white w-full rounded-t-xl p-6 space-y-6 max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-xl font-semibold text-gray-900">Add New Book</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Search Mode Toggle */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">How would you like to add this book?</h3>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    setSearchMode('search')
                    setGoogleSearchResults([])
                    setShowBarcodeScanner(false)
                  }}
                  className={`btn flex flex-col items-center gap-2 py-4 h-auto ${searchMode === 'search' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <Search className="w-5 h-5" />
                  <span className="text-sm font-medium">Search</span>
                </button>
                <button
                  onClick={() => {
                    setSearchMode('scan')
                    setGoogleSearchResults([])
                    setGoogleSearchTerm('')
                    setShowBarcodeScanner(true)
                  }}
                  className={`btn flex flex-col items-center gap-2 py-4 h-auto ${searchMode === 'scan' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <Scan className="w-5 h-5" />
                  <span className="text-sm font-medium">Scan</span>
                </button>
                <button
                  onClick={() => {
                    setSearchMode('manual')
                    setGoogleSearchResults([])
                    setGoogleSearchTerm('')
                    setShowBarcodeScanner(false)
                  }}
                  className={`btn flex flex-col items-center gap-2 py-4 h-auto ${searchMode === 'manual' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <BookOpen className="w-5 h-5" />
                  <span className="text-sm font-medium">Manual</span>
                </button>
              </div>
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
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-700">Search Results</h4>
                      <span className="text-xs text-gray-500">{googleSearchResults.length} found</span>
                    </div>
                    <div className="space-y-2 max-h-72 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                      {googleSearchResults.map((googleBook) => (
                        <div
                          key={googleBook.id}
                          onClick={() => selectGoogleBook(googleBook)}
                          className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 hover:shadow-sm transition-all"
                        >
                          {googleBook.volumeInfo.imageLinks?.thumbnail ? (
                            <img
                              src={googleBook.volumeInfo.imageLinks.thumbnail}
                              alt={googleBook.volumeInfo.title}
                              className="w-12 h-16 object-cover rounded flex-shrink-0 shadow-sm"
                            />
                          ) : (
                            <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                              <BookOpen className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
                              {googleBook.volumeInfo.title}
                            </h4>
                            <p className="text-xs text-gray-600 mb-2">
                              {googleBook.volumeInfo.authors?.join(', ') || 'Unknown Author'}
                            </p>
                            {googleBook.volumeInfo.publishedDate && (
                              <span className="inline-block px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                                {new Date(googleBook.volumeInfo.publishedDate).getFullYear()}
                              </span>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {googleSearchTerm && !isSearching && googleSearchResults.length === 0 && (
                  <div className="text-center py-6 text-gray-500 border border-gray-200 rounded-lg bg-gray-50">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No books found. Try a different search term or add manually.</p>
                  </div>
                )}
              </>
            )}

            {/* Scan Mode Instructions */}
            {searchMode === 'scan' && !showBarcodeScanner && (
              <div className="text-center py-8 border border-gray-200 rounded-lg bg-gray-50">
                <div className="bg-white inline-flex p-4 rounded-full mb-4 shadow-sm">
                  <Scan className="w-8 h-8 text-primary-600" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Barcode Scanner Ready</h4>
                <p className="text-sm text-gray-600 mb-4 max-w-sm mx-auto">
                  Position your phone's camera over a book barcode (usually on the back cover) to automatically add book details.
                </p>
                <button
                  onClick={() => setShowBarcodeScanner(true)}
                  className="btn btn-primary"
                >
                  <Scan className="w-4 h-4 mr-2" />
                  Start Scanning
                </button>
              </div>
            )}

            {/* Manual Entry Form */}
            {searchMode === 'manual' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Book Details</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-600 uppercase tracking-wide font-medium">Title *</label>
                      <input
                        type="text"
                        placeholder="Enter the book title..."
                        value={newBook.title}
                        onChange={(e) => setNewBook(prev => ({ ...prev, title: e.target.value }))}
                        className="input mt-1"
                        autoFocus
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-600 uppercase tracking-wide font-medium">Author *</label>
                      <input
                        type="text"
                        placeholder="Enter the author's name..."
                        value={newBook.author}
                        onChange={(e) => setNewBook(prev => ({ ...prev, author: e.target.value }))}
                        className="input mt-1"
                      />
                    </div>

                    {newBook.isbn && (
                      <div>
                        <label className="text-xs text-gray-600 uppercase tracking-wide font-medium">ISBN (From Barcode)</label>
                        <input
                          type="text"
                          value={newBook.isbn}
                          onChange={(e) => setNewBook(prev => ({ ...prev, isbn: e.target.value }))}
                          className="input mt-1 bg-gray-50"
                          readOnly
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Book Preview (when title is filled) */}
            {newBook.title && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Book Preview</h4>
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="flex items-start gap-4">
                    {newBook.cover ? (
                      <img 
                        src={newBook.cover} 
                        alt={newBook.title}
                        className="w-16 h-20 object-cover rounded shadow-sm flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-20 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold text-gray-900 mb-1">{newBook.title}</h5>
                      <p className="text-sm text-gray-600 mb-2">{newBook.author}</p>
                      {newBook.publishedDate && (
                        <p className="text-xs text-gray-500">Published: {new Date(newBook.publishedDate).getFullYear()}</p>
                      )}
                      {newBook.pageCount && (
                        <p className="text-xs text-gray-500">{newBook.pageCount} pages</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Status Selection */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">How would you categorize this book?</h4>
              <div className="grid grid-cols-2 gap-3">
                {/* Physical Copy */}
                <button
                  onClick={() => setNewBook(prev => ({ ...prev, status: 'physical' }))}
                  className={`btn flex flex-col items-center gap-2 py-4 h-auto ${newBook.status === 'physical' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <div className="flex items-center gap-1">
                    <Check className="w-5 h-5" />
                    <span className="text-lg">📚</span>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">Physical Copy</div>
                    <div className="text-xs opacity-75">I own the paperback/hardcover</div>
                  </div>
                </button>

                {/* Digital Copy */}
                <button
                  onClick={() => setNewBook(prev => ({ ...prev, status: 'digital' }))}
                  className={`btn flex flex-col items-center gap-2 py-4 h-auto ${newBook.status === 'digital' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <div className="flex items-center gap-1">
                    <Check className="w-5 h-5" />
                    <span className="text-lg">📱</span>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">Digital Copy</div>
                    <div className="text-xs opacity-75">Kindle, audiobook, or ebook</div>
                  </div>
                </button>

                {/* Both Formats */}
                <button
                  onClick={() => setNewBook(prev => ({ ...prev, status: 'both' }))}
                  className={`btn flex flex-col items-center gap-2 py-4 h-auto ${newBook.status === 'both' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <div className="flex items-center gap-1">
                    <Check className="w-5 h-5" />
                    <span className="text-lg">📚📱</span>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">Both Formats</div>
                    <div className="text-xs opacity-75">I own physical + digital</div>
                  </div>
                </button>

                {/* Read but Don't Own */}
                <button
                  onClick={() => setNewBook(prev => ({ ...prev, status: 'read' }))}
                  className={`btn flex flex-col items-center gap-2 py-4 h-auto ${newBook.status === 'read' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <div className="flex items-center gap-1">
                    <Check className="w-5 h-5" />
                    <span className="text-lg">✅</span>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">Read It</div>
                    <div className="text-xs opacity-75">Borrowed, library, or finished</div>
                  </div>
                </button>
              </div>
              
              {/* Wishlist as separate row */}
              <button
                onClick={() => setNewBook(prev => ({ ...prev, status: 'wishlist' }))}
                className={`btn flex items-center justify-center gap-3 py-4 w-full ${newBook.status === 'wishlist' ? 'btn-primary' : 'btn-secondary'}`}
              >
                <Eye className="w-5 h-5" />
                <span className="text-lg">🔖</span>
                <div className="text-center">
                  <div className="font-medium">Want to Read</div>
                  <div className="text-xs opacity-75">Add to my wishlist</div>
                </div>
              </button>
            </div>
            
            {/* Action Buttons */}
            <div className="border-t border-gray-200 pt-6 mt-8">
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setShowAddForm(false)
                    setShowBarcodeScanner(false)
                    setNewBook({ 
                      title: '', 
                      author: '', 
                      status: 'physical', 
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
                  className="btn btn-secondary flex-1 py-3"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddBook} 
                  className="btn btn-primary flex-1 py-3 font-semibold"
                  disabled={!newBook.title.trim() || !newBook.author.trim()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Library
                </button>
              </div>
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