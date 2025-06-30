'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, BookOpen, Eye, Check, ChevronRight, Scan, LogOut, User, Library, Heart, BookCheck, Filter, Star, UserCheck } from 'lucide-react'
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
    status: 'physical' as 'physical' | 'digital' | 'both' | 'read' | 'wishlist' | 'lent', 
    cover: '', 
    isbn: '',
    description: '',
    pageCount: undefined as number | undefined,
    publishedDate: '',
    publisher: '',
    categories: [] as string[]
  })
  const [filter, setFilter] = useState<'all' | 'owned' | 'wishlist' | 'read' | 'lent'>('all')
  const [subFilter, setSubFilter] = useState<'all' | 'physical' | 'digital'>('all')
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
      // Check sub-filter for owned books
      if (subFilter === 'all') {
        matchesFilter = ['physical', 'digital', 'both'].includes(book.status)
      } else if (subFilter === 'physical') {
        matchesFilter = ['physical', 'both'].includes(book.status)
      } else if (subFilter === 'digital') {
        matchesFilter = ['digital', 'both'].includes(book.status)
      }
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
  const lentCount = books.filter(book => book.status === 'lent').length

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <header className="header-gradient text-white safe-area-top">
        <div className="px-6 py-4">
          {/* User Info & Actions */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-white/90 text-sm">Welcome back,</p>
                <p className="font-semibold text-white">
                  {user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Reader'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-3 hover:bg-white/10 rounded-xl transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* App Title */}
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-white mb-1">My Library</h1>
            <p className="text-white/80 text-sm">Your personal book collection</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <Library className="w-4 h-4 mx-auto mb-1 text-white/90" />
              <p className="text-lg font-bold text-white">{ownedCount}</p>
              <p className="text-xs text-white/80">Owned</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <Heart className="w-4 h-4 mx-auto mb-1 text-white/90" />
              <p className="text-lg font-bold text-white">{wishlistCount}</p>
              <p className="text-xs text-white/80">Wishlist</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <BookCheck className="w-4 h-4 mx-auto mb-1 text-white/90" />
              <p className="text-lg font-bold text-white">{readCount}</p>
              <p className="text-xs text-white/80">Read</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <UserCheck className="w-4 h-4 mx-auto mb-1 text-white/90" />
              <p className="text-lg font-bold text-white">{lentCount}</p>
              <p className="text-xs text-white/80">Lent</p>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Search and Filter */}
      <div className="px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        {/* Search Bar */}
        <div className="search-container mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search your library..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-12 pr-4"
            />
          </div>
        </div>
        
        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => {
              setFilter('all')
              setSubFilter('all')
            }}
            className={`filter-pill whitespace-nowrap ${filter === 'all' ? 'filter-pill-active' : 'filter-pill-inactive'}`}
          >
            All Books ({books.length})
          </button>
          <button
            onClick={() => {
              setFilter('owned')
              setSubFilter('all')
            }}
            className={`filter-pill whitespace-nowrap ${filter === 'owned' ? 'filter-pill-active' : 'filter-pill-inactive'}`}
          >
            Owned ({ownedCount})
          </button>
          <button
            onClick={() => {
              setFilter('wishlist')
              setSubFilter('all')
            }}
            className={`filter-pill whitespace-nowrap ${filter === 'wishlist' ? 'filter-pill-active' : 'filter-pill-inactive'}`}
          >
            Wishlist ({wishlistCount})
          </button>
          <button
            onClick={() => {
              setFilter('read')
              setSubFilter('all')
            }}
            className={`filter-pill whitespace-nowrap ${filter === 'read' ? 'filter-pill-active' : 'filter-pill-inactive'}`}
          >
            Read ({readCount})
          </button>
          <button
            onClick={() => {
              setFilter('lent')
              setSubFilter('all')
            }}
            className={`filter-pill whitespace-nowrap ${filter === 'lent' ? 'filter-pill-active' : 'filter-pill-inactive'}`}
          >
            Lent ({lentCount})
          </button>
        </div>

        {/* Sub-filters for Owned */}
        {filter === 'owned' && (
          <div className="flex gap-2 mt-3 pl-4">
            <button
              onClick={() => setSubFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                subFilter === 'all' 
                  ? 'bg-blue-100 text-blue-800 border-blue-200' 
                  : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
              }`}
            >
              All Owned
            </button>
            <button
              onClick={() => setSubFilter('physical')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                subFilter === 'physical' 
                  ? 'bg-blue-100 text-blue-800 border-blue-200' 
                  : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
              }`}
            >
              Physical Books
            </button>
            <button
              onClick={() => setSubFilter('digital')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                subFilter === 'digital' 
                  ? 'bg-blue-100 text-blue-800 border-blue-200' 
                  : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
              }`}
            >
              Digital Copies
            </button>
          </div>
        )}
      </div>

      {/* Enhanced Book Grid */}
      <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
        {loading ? (
          <div className="text-center py-12">
            <div className="spinner h-12 w-12 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your amazing library...</p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm 
                ? "No books found" 
                : books.length === 0 
                  ? "Start your library!" 
                  : "No books in this category"
              }
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? "Try adjusting your search terms" 
                : books.length === 0 
                  ? "Add your first book to get started" 
                  : "Switch to a different filter to see more books"
              }
            </p>
            {books.length === 0 && (
              <button
                onClick={() => setShowAddForm(true)}
                className="btn btn-primary inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Your First Book
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4 pb-20">
            {filteredBooks.map(book => (
              <div 
                key={book.id} 
                className="book-card cursor-pointer fade-in"
                onClick={() => router.push(`/book/${book.id}`)}
              >
                <div className="flex gap-4">
                  {/* Book Cover */}
                  <div className="flex-shrink-0">
                    {book.cover ? (
                      <img 
                        src={book.cover} 
                        alt={book.title}
                        className="w-16 h-24 object-cover rounded-lg shadow-md border border-gray-100"
                      />
                    ) : (
                      <div className="w-16 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center shadow-md border border-gray-100">
                        <BookOpen className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Book Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-lg leading-tight mb-1 line-clamp-2">
                          {book.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-1">
                          {book.author}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0" />
                    </div>

                    {/* Status and Date */}
                    <div className="flex items-center justify-between">
                      <span className={`status-badge ${
                        ['physical', 'digital', 'both'].includes(book.status)
                          ? 'status-owned' 
                          : book.status === 'read'
                          ? 'status-read'
                          : book.status === 'lent'
                          ? 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border border-orange-200'
                          : 'status-wishlist'
                      }`}>
                        {book.status === 'physical' && (
                          <>
                            <Library className="w-4 h-4" />
                            Physical
                          </>
                        )}
                        {book.status === 'digital' && (
                          <>
                            <BookOpen className="w-4 h-4" />
                            Digital
                          </>
                        )}
                        {book.status === 'both' && (
                          <>
                            <Star className="w-4 h-4" />
                            Both Formats
                          </>
                        )}
                        {book.status === 'read' && (
                          <>
                            <BookCheck className="w-4 h-4" />
                            Read
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
                            Wishlist
                          </>
                        )}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">
                        {book.dateAdded}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowAddForm(true)}
          className="w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center justify-center active:scale-95"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Enhanced Add Book Modal */}
      {showAddForm && (
        <div className="modal-overlay slide-up">
          <div className="modal-content">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">Add New Book</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Search Mode Selection */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">How would you like to add this book?</h3>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      setSearchMode('search')
                      setGoogleSearchResults([])
                      setShowBarcodeScanner(false)
                    }}
                    className={`btn flex flex-col items-center gap-2 py-4 h-auto ${searchMode === 'search' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    <Search className="w-6 h-6" />
                    <span className="text-sm font-semibold">Search</span>
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
                    <Scan className="w-6 h-6" />
                    <span className="text-sm font-semibold">Scan</span>
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
                    <BookOpen className="w-6 h-6" />
                    <span className="text-sm font-semibold">Manual</span>
                  </button>
                </div>
              </div>

              {/* Google Books Search */}
              {searchMode === 'search' && (
                <>
                  <div className="search-container">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search for books..."
                        value={googleSearchTerm}
                        onChange={(e) => setGoogleSearchTerm(e.target.value)}
                        className="input pl-12 pr-4"
                        autoFocus
                      />
                      {isSearching && (
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          <div className="spinner h-5 w-5"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Search Results */}
                  {googleSearchResults.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-700">Search Results</h4>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {googleSearchResults.length} found
                        </span>
                      </div>
                      <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                        {googleSearchResults.map((googleBook) => (
                          <div
                            key={googleBook.id}
                            onClick={() => selectGoogleBook(googleBook)}
                            className="card cursor-pointer p-4 hover:shadow-lg transition-all duration-200"
                          >
                            <div className="flex gap-3">
                              {googleBook.volumeInfo.imageLinks?.thumbnail ? (
                                <img
                                  src={googleBook.volumeInfo.imageLinks.thumbnail}
                                  alt={googleBook.volumeInfo.title}
                                  className="w-12 h-16 object-cover rounded-lg shadow-sm flex-shrink-0"
                                />
                              ) : (
                                <div className="w-12 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <BookOpen className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
                                  {googleBook.volumeInfo.title}
                                </h4>
                                <p className="text-xs text-gray-600 mb-2">
                                  {googleBook.volumeInfo.authors?.join(', ') || 'Unknown Author'}
                                </p>
                                {googleBook.volumeInfo.publishedDate && (
                                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                    {new Date(googleBook.volumeInfo.publishedDate).getFullYear()}
                                  </span>
                                )}
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {googleSearchTerm && !isSearching && googleSearchResults.length === 0 && (
                    <div className="text-center py-8 border border-gray-200 rounded-xl bg-gray-50">
                      <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                      <p className="text-gray-600 mb-2">No books found</p>
                      <p className="text-sm text-gray-500">Try a different search term or add manually</p>
                    </div>
                  )}
                </>
              )}

              {/* Manual Entry Form */}
              {searchMode === 'manual' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Book Title *</label>
                    <input
                      type="text"
                      placeholder="Enter book title"
                      value={newBook.title}
                      onChange={(e) => setNewBook(prev => ({ ...prev, title: e.target.value }))}
                      className="input"
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Author *</label>
                    <input
                      type="text"
                      placeholder="Enter author name"
                      value={newBook.author}
                      onChange={(e) => setNewBook(prev => ({ ...prev, author: e.target.value }))}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                    <select
                      value={newBook.status}
                      onChange={(e) => setNewBook(prev => ({ 
                        ...prev, 
                        status: e.target.value as 'physical' | 'digital' | 'both' | 'read' | 'wishlist' | 'lent'
                      }))}
                      className="input"
                    >
                      <option value="physical">📚 Physical Copy</option>
                      <option value="digital">📱 Digital Copy</option>
                      <option value="both">⭐ Both Formats</option>
                      <option value="read">✅ Read It</option>
                      <option value="wishlist">❤️ Want to Read</option>
                      <option value="lent">👤 Lent Out</option>
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="btn btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddBook}
                      disabled={!newBook.title.trim() || !newBook.author.trim()}
                      className="btn btn-primary flex-1"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Book
                    </button>
                  </div>
                </div>
              )}
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
    </div>
  )
} 