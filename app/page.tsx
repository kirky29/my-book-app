'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, BookOpen, Eye, Check, ChevronRight, Scan, LogOut, User, Library, Heart, BookCheck, Filter, Star, UserCheck, Hash, X, Edit3 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useBooks } from './contexts/BookContext'
import { useAuth } from './contexts/AuthContext'
import BarcodeScanner from './components/BarcodeScanner'
import StarRating from './components/StarRating'
import QuickISBNSearch from './components/QuickISBNSearch'

interface Book {
  id: string
  title: string
  author: string
  status: 'physical' | 'digital' | 'both' | 'wishlist' | 'lent' | 'none'
  readStatus: 'unread' | 'reading' | 'read'
  rating?: number
  series?: string
  seriesNumber?: number
  dateAdded: string
  cover?: string
  isbn?: string
  description?: string
  pageCount?: number
  publishedDate?: string
  publisher?: string
  categories?: string[]
  notes?: string
  lentTo?: string
}

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
  const { books, addBook, toggleBookStatus, loading, findDuplicates, getBooksByISBN, updateBook } = useBooks()
  const { user, logout } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showISBNSearch, setShowISBNSearch] = useState(false)
  const [newBook, setNewBook] = useState({ 
    title: '', 
    author: '', 
    status: 'physical' as 'physical' | 'digital' | 'both' | 'wishlist' | 'lent' | 'none', 
    readStatus: 'unread' as 'unread' | 'reading' | 'read',
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
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isFromGoogleBooks, setIsFromGoogleBooks] = useState(false)
  const [duplicateBooks, setDuplicateBooks] = useState<Book[]>([])
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false)

  // Handle URL parameters for PWA shortcuts
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const action = urlParams.get('action')
    
    if (action === 'add') {
      setShowAddForm(true)
    } else if (action === 'scan') {
      setShowBarcodeScanner(true)
    }
  }, [])

  // Debounced Google Books search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (googleSearchTerm && showAddForm) {
        searchGoogleBooks(googleSearchTerm)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [googleSearchTerm, showAddForm])

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

  const checkForDuplicates = (title: string, author: string, isbn?: string) => {
    let duplicates: Book[] = []
    
    // Check for ISBN duplicates first (most accurate)
    if (isbn && isbn.trim()) {
      const isbnDuplicates = getBooksByISBN(isbn.trim())
      duplicates = [...duplicates, ...isbnDuplicates]
    }
    
    // Check for title/author duplicates
    const titleAuthorDuplicates = findDuplicates(title, author)
    duplicates = [...duplicates, ...titleAuthorDuplicates]
    
    // Remove any actual duplicates from our duplicate array
    return duplicates.filter((book, index, self) => 
      index === self.findIndex(b => b.id === book.id)
    )
  }

  const handleAddBook = async () => {
    if (newBook.title.trim() && newBook.author.trim()) {
      // Check for duplicates first
      const duplicates = checkForDuplicates(newBook.title.trim(), newBook.author.trim(), newBook.isbn)
      
      if (duplicates.length > 0) {
        setDuplicateBooks(duplicates)
        setShowDuplicateWarning(true)
        return
      }

      try {
        // Create book data object with proper typing, excluding undefined values
        const bookData: any = {
          title: newBook.title.trim(),
          author: newBook.author.trim(),
          status: newBook.status,
          readStatus: newBook.readStatus,
        }
        
        // Only add optional fields if they have values
        if (newBook.cover && newBook.cover.trim()) {
          bookData.cover = newBook.cover.trim()
        }
        if (newBook.isbn && newBook.isbn.trim()) {
          bookData.isbn = newBook.isbn.trim()
        }
        if (newBook.description && newBook.description.trim()) {
          bookData.description = newBook.description.trim()
        }
        if (newBook.pageCount && typeof newBook.pageCount === 'number') {
          bookData.pageCount = newBook.pageCount
        }
        if (newBook.publishedDate && newBook.publishedDate.trim()) {
          bookData.publishedDate = newBook.publishedDate.trim()
        }
        if (newBook.publisher && newBook.publisher.trim()) {
          bookData.publisher = newBook.publisher.trim()
        }
        if (newBook.categories && newBook.categories.length > 0) {
          bookData.categories = newBook.categories
        }
        
        console.log('Adding book with cleaned data:', bookData)
        await addBook(bookData)
        resetForm()
      } catch (error) {
        console.error('Error adding book:', error)
        // More specific error message
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        alert(`Failed to add book: ${errorMessage}. Please try again.`)
      }
    }
  }

  const handleAddDespiteDuplicates = async () => {
    setShowDuplicateWarning(false)
    setDuplicateBooks([])
    
    try {
      // Create book data object with proper typing, excluding undefined values
      const bookData: any = {
        title: newBook.title.trim(),
        author: newBook.author.trim(),
        status: newBook.status,
        readStatus: newBook.readStatus,
      }
      
      // Only add optional fields if they have values
      if (newBook.cover && newBook.cover.trim()) {
        bookData.cover = newBook.cover.trim()
      }
      if (newBook.isbn && newBook.isbn.trim()) {
        bookData.isbn = newBook.isbn.trim()
      }
      if (newBook.description && newBook.description.trim()) {
        bookData.description = newBook.description.trim()
      }
      if (newBook.pageCount && typeof newBook.pageCount === 'number') {
        bookData.pageCount = newBook.pageCount
      }
      if (newBook.publishedDate && newBook.publishedDate.trim()) {
        bookData.publishedDate = newBook.publishedDate.trim()
      }
      if (newBook.publisher && newBook.publisher.trim()) {
        bookData.publisher = newBook.publisher.trim()
      }
      if (newBook.categories && newBook.categories.length > 0) {
        bookData.categories = newBook.categories
      }
      
      console.log('Adding book with cleaned data (despite duplicates):', bookData)
      await addBook(bookData)
      resetForm()
    } catch (error) {
      console.error('Error adding book:', error)
      // More specific error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to add book: ${errorMessage}. Please try again.`)
    }
  }

  const handleUpdateExistingBook = async (existingBookId: string, newStatus: Book['status']) => {
    try {
      await updateBook(existingBookId, { status: newStatus })
      setShowDuplicateWarning(false)
      setDuplicateBooks([])
      resetForm()
    } catch (error) {
      console.error('Error updating book:', error)
      alert('Failed to update existing book. Please try again.')
    }
  }

  const resetForm = () => {
    setNewBook({ 
      title: '', 
      author: '', 
      status: 'physical', 
      readStatus: 'unread',
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
    setIsEditing(false)
    setIsFromGoogleBooks(false)
    setShowDuplicateWarning(false)
    setDuplicateBooks([])
  }

  const selectGoogleBook = (googleBook: GoogleBook) => {
    const authors = googleBook.volumeInfo.authors || ['Unknown Author']
    const isbn = googleBook.volumeInfo.industryIdentifiers?.find(
      id => id.type === 'ISBN_13' || id.type === 'ISBN_10'
    )?.identifier || ''
    
    // Validate and clean all fields to ensure they're safe for Firebase
    const title = googleBook.volumeInfo.title?.trim() || 'Unknown Title'
    const author = authors.join(', ').trim() || 'Unknown Author'
    const cover = googleBook.volumeInfo.imageLinks?.thumbnail || ''
    const description = googleBook.volumeInfo.description?.trim() || ''
    const pageCount = typeof googleBook.volumeInfo.pageCount === 'number' ? googleBook.volumeInfo.pageCount : undefined
    const publishedDate = googleBook.volumeInfo.publishedDate?.trim() || ''
    const publisher = googleBook.volumeInfo.publisher?.trim() || ''
    const categories = Array.isArray(googleBook.volumeInfo.categories) ? googleBook.volumeInfo.categories : []
    
    console.log('Selected Google Book:', { title, author, cover, isbn, description, pageCount, publishedDate, publisher, categories })
    
    // Check for duplicates before setting the book data
    const duplicates = checkForDuplicates(title, author, isbn.trim())
    
    if (duplicates.length > 0) {
      setDuplicateBooks(duplicates)
      setShowDuplicateWarning(true)
      // Still set the book data so the user can see what they tried to add
      setNewBook({
        title,
        author,
        status: newBook.status,
        readStatus: 'unread',
        cover,
        isbn: isbn.trim(),
        description,
        pageCount,
        publishedDate,
        publisher,
        categories
      })
      setGoogleSearchResults([])
      setGoogleSearchTerm('')
      return
    }
    
    setNewBook({
      title,
      author,
      status: newBook.status,
      readStatus: 'unread',
      cover,
      isbn: isbn.trim(),
      description,
      pageCount,
      publishedDate,
      publisher,
      categories
    })
    setGoogleSearchResults([])
    setGoogleSearchTerm('')
    setIsEditing(true)
    setIsFromGoogleBooks(true)
  }

  const handleBarcodeScanned = async (scannedCode: string) => {
    setShowBarcodeScanner(false)
    
    // Clean up the scanned code (remove any non-digit characters except X for ISBN-10)
    const cleanedCode = scannedCode.replace(/[^\dX]/gi, '')
    
    console.log('Scanned barcode:', scannedCode, 'Cleaned:', cleanedCode)
    
    if (cleanedCode.length >= 10) {
      // Search Google Books using the scanned ISBN
      try {
        const response = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanedCode}`
        )
        const data = await response.json()
        
        console.log('ISBN search response:', data)
        
        if (data.items && data.items.length > 0) {
          // Auto-select the first result (this will now check for duplicates)
          console.log('Found book via ISBN:', data.items[0])
          selectGoogleBook(data.items[0])
        } else {
          // If no results found, set the ISBN and let user search manually
          setNewBook(prev => ({ ...prev, isbn: cleanedCode }))
          setIsEditing(true)
          setIsFromGoogleBooks(false)
          alert('Book not found in database. Please enter details manually.')
        }
      } catch (error) {
        console.error('Error searching for scanned book:', error)
        setNewBook(prev => ({ ...prev, isbn: cleanedCode }))
        setIsEditing(true)
        setIsFromGoogleBooks(false)
        alert('Error searching for book. Please enter details manually.')
      }
    } else {
      alert('Invalid barcode. Please try scanning again.')
    }
  }

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (book.series && book.series.toLowerCase().includes(searchTerm.toLowerCase()))
    
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
    } else if (filter === 'read') {
      matchesFilter = book.readStatus === 'read'
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
  const readCount = books.filter(book => book.readStatus === 'read').length
  const lentCount = books.filter(book => book.status === 'lent').length

  return (
    <div className="flex flex-col mobile-container bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 touch-optimized">
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
                        <p className="text-gray-600 text-sm mb-2 line-clamp-1">
                          {book.author}
                        </p>
                        
                        {/* Series Information */}
                        {book.series && (
                          <p className="text-blue-600 text-xs mb-2 flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            {book.series}
                            {book.seriesNumber && ` #${book.seriesNumber}`}
                          </p>
                        )}
                        
                        {/* Rating Display */}
                        {book.rating && book.rating > 0 && (
                          <div className="mb-3">
                            <StarRating 
                              rating={book.rating} 
                              readOnly={true} 
                              size="sm"
                            />
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0" />
                    </div>

                    {/* Status and Date */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
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
                          {book.status === 'none' && (
                            <>
                              <Eye className="w-4 h-4" />
                              Not Owned
                            </>
                          )}
                        </span>

                        {/* Reading Status Badge */}
                        {book.readStatus !== 'unread' && (
                          <span className={`status-badge ${
                            book.readStatus === 'read' 
                              ? 'status-read'
                              : 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 border border-purple-200'
                          }`}>
                            {book.readStatus === 'read' && (
                              <>
                                <BookCheck className="w-4 h-4" />
                                Read
                              </>
                            )}
                            {book.readStatus === 'reading' && (
                              <>
                                <BookOpen className="w-4 h-4" />
                                Reading
                              </>
                            )}
                          </span>
                        )}
                      </div>
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

      {/* Floating Action Buttons */}
      <div className="fab-bottom-right flex flex-col gap-3">
        {/* Quick ISBN Search Button */}
        <button
          onClick={() => setShowISBNSearch(true)}
          className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center active:scale-95"
          title="Quick ISBN Check"
        >
          <Hash className="w-5 h-5" />
        </button>
        
        {/* Add Book Button */}
        <button
          onClick={() => setShowAddForm(true)}
          className="w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center justify-center active:scale-95"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Enhanced Add Book Modal */}
      {showAddForm && (
        <div className="modal-overlay slide-up safe-area-bottom">
          <div className="modal-content max-w-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">Add New Book</h2>
              <button
                onClick={resetForm}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {!isEditing ? (
                <>
                  {/* Search Section */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Find Your Book</h3>
                    
                    {/* Search Bar */}
                    <div className="search-container mb-4">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          placeholder="Search by title, author, or ISBN..."
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

                    {/* Quick Actions */}
                    <div className="flex gap-3 mb-6">
                      <button
                        onClick={() => setShowBarcodeScanner(true)}
                        className="btn btn-secondary flex items-center gap-2"
                      >
                        <Scan className="w-4 h-4" />
                        Scan Barcode
                      </button>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="btn btn-secondary flex items-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        Enter Manually
                      </button>
                    </div>

                    {/* Search Results */}
                    {googleSearchResults.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-700 mb-3">
                          Found {googleSearchResults.length} book{googleSearchResults.length !== 1 ? 's' : ''}
                        </h4>
                        <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                          {googleSearchResults.map((googleBook) => (
                            <div
                              key={googleBook.id}
                              onClick={() => selectGoogleBook(googleBook)}
                              className="card cursor-pointer p-4 hover:shadow-lg transition-all duration-200 hover:border-blue-200"
                            >
                              <div className="flex gap-4">
                                {googleBook.volumeInfo.imageLinks?.thumbnail ? (
                                  <img
                                    src={googleBook.volumeInfo.imageLinks.thumbnail}
                                    alt={googleBook.volumeInfo.title}
                                    className="w-16 h-24 object-cover rounded-lg shadow-sm flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-16 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <BookOpen className="w-6 h-6 text-gray-400" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-900 text-lg line-clamp-2 mb-2">
                                    {googleBook.volumeInfo.title}
                                  </h4>
                                  <p className="text-gray-600 mb-2">
                                    {googleBook.volumeInfo.authors?.join(', ') || 'Unknown Author'}
                                  </p>
                                  <div className="flex items-center gap-3 text-sm text-gray-500">
                                    {googleBook.volumeInfo.publishedDate && (
                                      <span>{new Date(googleBook.volumeInfo.publishedDate).getFullYear()}</span>
                                    )}
                                    {googleBook.volumeInfo.pageCount && (
                                      <span>{googleBook.volumeInfo.pageCount} pages</span>
                                    )}
                                  </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No Results */}
                    {googleSearchTerm && !isSearching && googleSearchResults.length === 0 && (
                      <div className="text-center py-8 border border-gray-200 rounded-xl bg-gray-50">
                        <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                        <p className="text-gray-600 mb-2">No books found</p>
                        <p className="text-sm text-gray-500 mb-4">
                          Can't find your book? Try a different search or add it manually.
                        </p>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="btn btn-primary"
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Add Manually
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Book Preview & Edit Form */}
                  <div className="space-y-6">
                    {/* Book Preview */}
                    {(newBook.title || newBook.cover) && (
                      <div className="card p-4 bg-blue-50 border-blue-200">
                        <h3 className="font-semibold text-blue-900 mb-3">Book Preview</h3>
                        <div className="flex gap-4">
                          {/* Cover Preview */}
                          <div className="flex-shrink-0">
                            {newBook.cover ? (
                              <img 
                                src={newBook.cover} 
                                alt={newBook.title}
                                className="w-20 h-30 object-cover rounded-lg shadow-md border border-gray-200"
                              />
                            ) : (
                              <div className="w-20 h-30 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center shadow-md border border-gray-200">
                                <BookOpen className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          {/* Book Info Preview */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-lg mb-1">{newBook.title || 'Book Title'}</h4>
                            <p className="text-gray-600 mb-2">{newBook.author || 'Author Name'}</p>
                            <div className="flex gap-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {newBook.status === 'physical' ? '📚 Physical' :
                                 newBook.status === 'digital' ? '📱 Digital' :
                                 newBook.status === 'both' ? '⭐ Both' :
                                 newBook.status === 'wishlist' ? '❤️ Wishlist' :
                                 newBook.status === 'lent' ? '👤 Lent' : '🤷‍♂️ Not Owned'}
                              </span>
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                {newBook.readStatus === 'read' ? '✅ Read' :
                                 newBook.readStatus === 'reading' ? '📚 Reading' : '📖 Unread'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Edit Form */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Book Details</h3>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          ← Back to Search
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Book Title *</label>
                          <input
                            type="text"
                            placeholder="Enter book title"
                            value={newBook.title}
                            onChange={(e) => setNewBook(prev => ({ ...prev, title: e.target.value }))}
                            disabled={isFromGoogleBooks}
                            className={`input ${isFromGoogleBooks ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : ''}`}
                          />
                          {isFromGoogleBooks && (
                            <p className="text-xs text-gray-500 mt-1">Title from Google Books (cannot be edited)</p>
                          )}
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Author *</label>
                          <input
                            type="text"
                            placeholder="Enter author name"
                            value={newBook.author}
                            onChange={(e) => setNewBook(prev => ({ ...prev, author: e.target.value }))}
                            disabled={isFromGoogleBooks}
                            className={`input ${isFromGoogleBooks ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : ''}`}
                          />
                          {isFromGoogleBooks && (
                            <p className="text-xs text-gray-500 mt-1">Author from Google Books (cannot be edited)</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Ownership</label>
                          <select
                            value={newBook.status}
                            onChange={(e) => setNewBook(prev => ({ 
                              ...prev, 
                              status: e.target.value as 'physical' | 'digital' | 'both' | 'wishlist' | 'lent' | 'none'
                            }))}
                            className="input"
                          >
                            <option value="physical">📚 Physical Copy</option>
                            <option value="digital">📱 Digital Copy</option>
                            <option value="both">⭐ Both Formats</option>
                            <option value="wishlist">❤️ Want to Read</option>
                            <option value="lent">👤 Lent Out</option>
                            <option value="none">🤷‍♂️ Not Owned</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Reading Status</label>
                          <select
                            value={newBook.readStatus}
                            onChange={(e) => setNewBook(prev => ({ 
                              ...prev, 
                              readStatus: e.target.value as 'unread' | 'reading' | 'read'
                            }))}
                            className="input"
                          >
                            <option value="unread">📖 Not Started</option>
                            <option value="reading">📚 Currently Reading</option>
                            <option value="read">✅ Finished</option>
                          </select>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-6 border-t">
                        <button
                          onClick={resetForm}
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
                          Add to Library
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick ISBN Search Modal */}
      {showISBNSearch && (
        <QuickISBNSearch
          onBookFound={(googleBook) => {
            selectGoogleBook(googleBook)
            setShowISBNSearch(false)
            setShowAddForm(true)
          }}
          onClose={() => setShowISBNSearch(false)}
        />
      )}

      {/* Barcode Scanner */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScanned}
          onClose={() => setShowBarcodeScanner(false)}
          isActive={showBarcodeScanner}
        />
      )}

      {/* Duplicate Warning Modal */}
      {showDuplicateWarning && (
        <div className="modal-overlay fade-in safe-area-bottom">
          <div className="modal-content max-w-lg">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Eye className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Book Already in Library</h2>
              </div>
              <button
                onClick={() => {
                  setShowDuplicateWarning(false)
                  setDuplicateBooks([])
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-700 mb-4">
                  You already have this book in your library:
                </p>
                
                {/* Show the book they're trying to add */}
                <div className="card p-4 bg-blue-50 border-blue-200 mb-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Trying to add:</h4>
                  <div className="flex gap-3">
                    {newBook.cover ? (
                      <img 
                        src={newBook.cover} 
                        alt={newBook.title}
                        className="w-12 h-18 object-cover rounded-lg shadow-sm border border-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-18 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center shadow-sm border border-gray-200">
                        <BookOpen className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{newBook.title}</h5>
                      <p className="text-sm text-gray-600">{newBook.author}</p>
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full mt-1">
                        {newBook.status === 'physical' ? '📚 Physical' :
                         newBook.status === 'digital' ? '📱 Digital' :
                         newBook.status === 'both' ? '⭐ Both' :
                         newBook.status === 'wishlist' ? '❤️ Wishlist' :
                         newBook.status === 'lent' ? '👤 Lent' : '🤷‍♂️ Not Owned'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Show existing duplicate books */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Already in your library:</h4>
                  {duplicateBooks.map((book) => (
                    <div key={book.id} className="card p-4 bg-gray-50 border-gray-200">
                      <div className="flex gap-3 items-start">
                        {book.cover ? (
                          <img 
                            src={book.cover} 
                            alt={book.title}
                            className="w-12 h-18 object-cover rounded-lg shadow-sm border border-gray-200"
                          />
                        ) : (
                          <div className="w-12 h-18 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center shadow-sm border border-gray-200">
                            <BookOpen className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{book.title}</h5>
                          <p className="text-sm text-gray-600 mb-2">{book.author}</p>
                          <div className="flex gap-2 flex-wrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              ['physical', 'digital', 'both'].includes(book.status)
                                ? 'bg-green-100 text-green-800' 
                                : book.status === 'lent'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {book.status === 'physical' ? '📚 Physical' :
                               book.status === 'digital' ? '📱 Digital' :
                               book.status === 'both' ? '⭐ Both' :
                               book.status === 'wishlist' ? '❤️ Wishlist' :
                               book.status === 'lent' ? '👤 Lent' : '🤷‍♂️ Not Owned'}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                              {book.readStatus === 'read' ? '✅ Read' :
                               book.readStatus === 'reading' ? '📚 Reading' : '📖 Unread'}
                            </span>
                          </div>
                          {book.isbn && (
                            <p className="text-xs text-gray-500 mt-1">ISBN: {book.isbn}</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          {newBook.status !== book.status && (
                            <button
                              onClick={() => handleUpdateExistingBook(book.id, newBook.status)}
                              className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-lg hover:bg-blue-200 transition-colors"
                              title={`Update to ${newBook.status}`}
                            >
                              Update Format
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowDuplicateWarning(false)
                    setDuplicateBooks([])
                  }}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddDespiteDuplicates}
                  className="btn btn-primary flex-1"
                >
                  Add Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 