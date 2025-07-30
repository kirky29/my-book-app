'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, BookOpen, Check, Heart, Settings } from 'lucide-react'
import { useBooks } from './contexts/BookContext'
import { useStatusOptions } from './contexts/StatusOptionsContext'
import { useTags } from './contexts/TagsContext'
import { useSeries } from './contexts/SeriesContext'

interface Book {
  id: string
  title: string
  author: string
  status: string
  cover?: string
  isbn?: string
  dateAdded: string
  publisher?: string
  publishedDate?: string
  pageCount?: number
  language?: string
  edition?: string
  tagIds?: string[]
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
    description?: string
  }
}

export default function BookTracker() {
  const router = useRouter()
  const { books, addBook, loading, findSimilarBooks } = useBooks()
  const { statusOptions } = useStatusOptions()
  const { tags } = useTags()
  const { series } = useSeries()
  
  // Debug: Log series data
  useEffect(() => {
    if (series.length > 0) {
      console.log('Available series:', series.map(s => ({ id: s.id, name: s.name, bookIds: s.bookIds })))
    }
  }, [series])
  
  // Debug: Log books and their series
  useEffect(() => {
    if (books.length > 0 && series.length > 0) {
      console.log('Books and their series:')
      books.forEach(book => {
        const bookSeries = getBookSeries(book)
        console.log(`${book.title}: ${bookSeries?.name || 'No series'}`)
      })
    }
  }, [books, series])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<GoogleBook[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [sortBy, setSortBy] = useState<'dateAdded' | 'title' | 'author'>('dateAdded')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('')
  const [selectedSeriesFilter, setSelectedSeriesFilter] = useState<string>('')
  
  // Debug: Log when series filter changes
  useEffect(() => {
    console.log('Series filter changed to:', selectedSeriesFilter)
  }, [selectedSeriesFilter])

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



  // Helper function to get status info
  const getStatusInfo = (statusId: string) => {
    const status = statusOptions.find(s => s.id === statusId)
    return status || { name: 'Unknown', color: 'gray', icon: '❓' }
  }

  // Helper function to get book tags
  const getBookTags = (book: Book) => {
    if (!book.tagIds || book.tagIds.length === 0) return []
    return tags.filter(tag => book.tagIds!.includes(tag.id))
  }

  // Helper function to get book series
  const getBookSeries = (book: Book) => {
    return series.find(s => s.bookIds.includes(book.id))
  }

  // Count books by status
  const ownedCount = books.filter(book => {
    const status = getStatusInfo(book.status)
    return status.name.toLowerCase().includes('owned')
  }).length
  const wishlistCount = books.filter(book => {
    const status = getStatusInfo(book.status)
    return status.name.toLowerCase().includes('wishlist')
  }).length

  // Sort books
  const sortedBooks = [...books].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title)
        break
      case 'author':
        comparison = a.author.localeCompare(b.author)
        break
      case 'dateAdded':
        // Handle both old format (YYYY-MM-DD) and new format (full ISO string)
        let dateA, dateB
        
        if (a.dateAdded.includes('T')) {
          // New format: full ISO string
          dateA = new Date(a.dateAdded)
        } else {
          // Old format: YYYY-MM-DD, add time to make it consistent
          dateA = new Date(a.dateAdded + 'T12:00:00')
        }
        
        if (b.dateAdded.includes('T')) {
          // New format: full ISO string
          dateB = new Date(b.dateAdded)
        } else {
          // Old format: YYYY-MM-DD, add time to make it consistent
          dateB = new Date(b.dateAdded + 'T12:00:00')
        }
        
        comparison = dateA.getTime() - dateB.getTime()
        
        // Debug logging
        console.log(`Sorting: ${a.title} (${a.dateAdded}) vs ${b.title} (${b.dateAdded})`)
        console.log(`Date A: ${dateA.toISOString()}, Date B: ${dateB.toISOString()}`)
        console.log(`Comparison: ${comparison}, Sort Order: ${sortOrder}`)
        break
    }
    
    return sortOrder === 'asc' ? comparison : -comparison
  })

  // Debug: Log all books and their dates
  console.log('All books with dates:')
  books.forEach(book => {
    console.log(`${book.title}: ${book.dateAdded}`)
  })
  
  // Filter books for search, tags, and series
  const filteredBooks = sortedBooks.filter(book => {
    const bookTags = getBookTags(book)
    const bookSeries = getBookSeries(book)
    
    // Check if search term matches title, author, tag names, or series names
    const matchesSearch = 
      !searchTerm || 
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bookTags.some(tag => tag.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (bookSeries && bookSeries.name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    // Check tag filter
    const matchesTag = !selectedTagFilter || bookTags.some(tag => tag.id === selectedTagFilter)
    
    // Check series filter
    const matchesSeries = !selectedSeriesFilter || (bookSeries && bookSeries.id === selectedSeriesFilter)
    
    // Debug logging for series filtering
    if (selectedSeriesFilter) {
      console.log(`Book: ${book.title}, Series: ${bookSeries?.name || 'None'}, Series ID: ${bookSeries?.id || 'None'}, Selected: ${selectedSeriesFilter}, matchesSeries: ${matchesSeries}`)
    }
    
    return matchesSearch && matchesTag && matchesSeries
  })

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
                onClick={() => router.push('/add')}
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
        <div className="space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by title, author, tags, or series..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 sm:py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            />
          </div>
          
          {/* Tag Filter */}
          {tags.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by tag:</span>
              <button
                onClick={() => setSelectedTagFilter('')}
                className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedTagFilter === ''
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                All Books
              </button>
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => setSelectedTagFilter(selectedTagFilter === tag.id ? '' : tag.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                    selectedTagFilter === tag.id
                      ? `bg-${tag.color}-100 text-${tag.color}-700 border border-${tag.color}-200`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                  }`}
                >
                  <span className="text-base">{tag.icon}</span>
                  <span>{tag.name}</span>
                </button>
              ))}
            </div>
          )}
          
          {/* Series Filter */}
          {series.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by series:</span>
              <button
                onClick={() => {
                  console.log('All Books button clicked')
                  setSelectedSeriesFilter('')
                }}
                className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedSeriesFilter === ''
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                All Books
              </button>
              {series.map((seriesItem) => (
                <button
                  key={seriesItem.id}
                  onClick={() => {
                    console.log('Series button clicked:', seriesItem.name, seriesItem.id)
                    setSelectedSeriesFilter(selectedSeriesFilter === seriesItem.id ? '' : seriesItem.id)
                  }}
                  className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                    selectedSeriesFilter === seriesItem.id
                      ? `bg-${seriesItem.color}-100 text-${seriesItem.color}-700 border border-${seriesItem.color}-200`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                  }`}
                >
                  <span className="text-base">{seriesItem.icon}</span>
                  <span>{seriesItem.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="spinner h-12 w-12 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your library...</p>
          </div>
        ) : (searchTerm && !selectedTagFilter && !selectedSeriesFilter) ? (
          // Search Results (only when no filters are active)
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
                            className="w-20 h-32 sm:w-24 sm:h-36 object-cover rounded-lg flex-shrink-0 shadow-md hover:shadow-lg transition-shadow"
                          />
                        ) : (
                          <div className="w-20 h-32 sm:w-24 sm:h-36 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                            <BookOpen className="w-8 h-8 text-gray-400" />
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
                          className="w-20 h-32 sm:w-24 sm:h-36 object-cover rounded-lg flex-shrink-0 shadow-md hover:shadow-lg transition-shadow"
                        />
                      ) : (
                        <div className="w-20 h-32 sm:w-24 sm:h-36 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                          <BookOpen className="w-8 h-8 text-green-600" />
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
              
              {/* Sorting Controls */}
              <div className="flex items-center gap-2">
                {/* Sort By */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'dateAdded' | 'title' | 'author')}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="dateAdded">Date Added</option>
                  <option value="title">Title</option>
                  <option value="author">Author</option>
                </select>
                
                {/* Sort Order */}
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 text-sm border border-gray-200 rounded-lg bg-white/80 backdrop-blur-sm hover:bg-gray-50 transition-colors"
                  title={sortOrder === 'asc' ? 'Sort Descending' : 'Sort Ascending'}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
                
                {/* View Mode */}
                <button
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="p-2 text-sm border border-gray-200 rounded-lg bg-white/80 backdrop-blur-sm hover:bg-gray-50 transition-colors"
                  title={viewMode === 'grid' ? 'List View' : 'Grid View'}
                >
                  {viewMode === 'grid' ? '☰' : '⊞'}
                </button>
              </div>
            </div>

            {filteredBooks.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-12 h-12 text-blue-600" />
                </div>
                {selectedTagFilter || selectedSeriesFilter ? (
                  <>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">No Books Found</h3>
                    <p className="text-gray-600 mb-8 text-lg">No books match your current filters</p>
                    <button
                      onClick={() => {
                        setSelectedTagFilter('')
                        setSelectedSeriesFilter('')
                        setSearchTerm('')
                      }}
                      className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
                    >
                      Clear All Filters
                    </button>
                  </>
                ) : books.length === 0 ? (
                  <>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Start Your Library</h3>
                    <p className="text-gray-600 mb-8 text-lg">Add your first book to get started</p>
                    <button
                      onClick={() => router.push('/add')}
                      className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
                    >
                      <Plus className="w-5 h-5" />
                      Add Your First Book
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">No Books Found</h3>
                    <p className="text-gray-600 mb-8 text-lg">No books match your search criteria</p>
                    <button
                      onClick={() => setSearchTerm('')}
                      className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
                    >
                      Clear Search
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-3'}>
                {filteredBooks.map((book) => (
                  <div 
                    key={book.id}
                    onClick={() => router.push(`/book/${book.id}`)}
                    className={`bg-white rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all ${
                      viewMode === 'grid' ? 'p-3' : 'p-4 sm:p-5'
                    }`}
                  >
                    {viewMode === 'grid' ? (
                      // Grid View
                      <div className="text-center">
                        {book.cover ? (
                          <img 
                            src={book.cover} 
                            alt={book.title}
                            className="w-full h-80 sm:h-96 object-cover rounded-lg mb-3 shadow-md hover:shadow-lg transition-shadow"
                          />
                        ) : (
                          <div className="w-full h-80 sm:h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center mb-3 shadow-md">
                            <BookOpen className="w-10 h-10 text-gray-400" />
                          </div>
                        )}
                        <h5 className="font-semibold text-gray-900 mb-1 text-lg truncate">{book.title}</h5>
                        <p className="text-xs text-gray-600 mb-2 truncate">{book.author}</p>
                        {(() => {
                          const status = getStatusInfo(book.status)
                          return (
                            <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full font-medium ${
                              status.name.toLowerCase().includes('owned')
                                ? 'bg-green-100 text-green-800' 
                                : status.name.toLowerCase().includes('wishlist')
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {status.icon} {status.name}
                            </span>
                          )
                        })()}
                        
                        {/* Tags */}
                        {(() => {
                          const bookTags = getBookTags(book)
                          if (bookTags.length === 0) return null
                          return (
                            <div className="flex flex-wrap gap-1 mt-2 justify-center">
                              {bookTags.slice(0, 2).map((tag) => (
                                <span
                                  key={tag.id}
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-${tag.color}-100 text-${tag.color}-800 border border-${tag.color}-200`}
                                >
                                  <span className="text-xs">{tag.icon}</span>
                                  <span className="truncate">{tag.name}</span>
                                </span>
                              ))}
                              {bookTags.length > 2 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                  +{bookTags.length - 2}
                                </span>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    ) : (
                      // List View
                      <div className="flex gap-5">
                        {book.cover ? (
                          <img 
                            src={book.cover} 
                            alt={book.title}
                            className="w-20 h-32 sm:w-24 sm:h-36 object-cover rounded-lg flex-shrink-0 shadow-md hover:shadow-lg transition-shadow"
                          />
                        ) : (
                          <div className="w-20 h-32 sm:w-24 sm:h-36 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                            <BookOpen className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h5 className="font-semibold text-gray-900 mb-2 text-base sm:text-lg truncate">{book.title}</h5>
                          <p className="text-sm sm:text-base text-gray-600 mb-3 truncate">{book.author}</p>
                          {(() => {
                            const status = getStatusInfo(book.status)
                            return (
                              <span className={`inline-flex items-center px-3 py-1.5 text-xs sm:text-sm rounded-full font-medium ${
                                status.name.toLowerCase().includes('owned')
                                  ? 'bg-green-100 text-green-800' 
                                  : status.name.toLowerCase().includes('wishlist')
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {status.icon} {status.name}
                              </span>
                            )
                          })()}
                          
                          {/* Tags */}
                          {(() => {
                            const bookTags = getBookTags(book)
                            if (bookTags.length === 0) return null
                            return (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {bookTags.slice(0, 3).map((tag) => (
                                  <span
                                    key={tag.id}
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-${tag.color}-100 text-${tag.color}-800 border border-${tag.color}-200`}
                                  >
                                    <span className="text-xs">{tag.icon}</span>
                                    <span className="truncate">{tag.name}</span>
                                  </span>
                                ))}
                                {bookTags.length > 3 && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                    +{bookTags.length - 3}
                                  </span>
                                )}
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>


    </div>
  )
} 