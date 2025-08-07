'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, BookOpen, Check, Heart, Settings, Filter, X, ChevronDown, ChevronUp } from 'lucide-react'
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

interface ActiveFilter {
  type: 'tag' | 'series' | 'status'
  id: string
  name: string
  color: string
  icon: string
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
  
  // New advanced filtering system
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([])
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [expandedFilterSections, setExpandedFilterSections] = useState<{
    tags: boolean
    series: boolean
    status: boolean
  }>({
    tags: true,
    series: true,
    status: true
  })

  // Debug: Log when filters change
  useEffect(() => {
    console.log('Active filters changed:', activeFilters)
  }, [activeFilters])

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
      if (searchTerm.trim()) {
        searchGoogleBooks(searchTerm)
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const selectBook = (book: GoogleBook) => {
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
    
    if (existingBook) {
      router.push(`/book/${existingBook.id}`)
    } else {
      // Use high-quality cover image URL
      const getHighResCover = (bookId: string, thumbnailUrl: string) => {
        if (!bookId) {
          return thumbnailUrl || ''
        }
        // Use the much better Google Books publisher content URL
        return `https://books.google.com/books/publisher/content/images/frontcover/${bookId}?fife=w400-h600&source=gbs_api`
      }
      
      const coverUrl = getHighResCover(book.id, book.volumeInfo.imageLinks?.thumbnail || '')
      router.push(`/add/preview?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&isbn=${encodeURIComponent(isbn)}&cover=${encodeURIComponent(coverUrl)}`)
    }
  }

  const getStatusInfo = (statusId: string) => {
    return statusOptions.find(status => status.id === statusId) || statusOptions[0]
  }

  // Function to improve existing book cover image quality
  const getImprovedCoverUrl = (coverUrl: string) => {
    if (!coverUrl) return ''
    
    // If it's already a high-quality Google Books URL, return as is
    if (coverUrl.includes('books.google.com/books/publisher/content/images/frontcover/')) {
      return coverUrl
    }
    
    // If it's a Google Books thumbnail URL, try to improve it
    if (coverUrl.includes('books.google.com')) {
      let improvedUrl = coverUrl
        .replace('&edge=curl', '') // Remove curl effect
        .replace('&zoom=1', '&zoom=5') // Increase zoom
        .replace('&source=gbs_api', '&source=gbs_api&img=1&zoom=5') // Add high quality parameters
      
      // Try to get even higher resolution
      if (improvedUrl.includes('books.google.com')) {
        improvedUrl = improvedUrl.replace('zoom=5', 'zoom=8')
        if (!improvedUrl.includes('&img=1')) {
          improvedUrl += '&img=1'
        }
      }
      
      return improvedUrl
    }
    
    // For other URLs, return as is
    return coverUrl
  }

  const getBookTags = (book: Book) => {
    return tags.filter(tag => book.tagIds?.includes(tag.id) || false)
  }

  const getBookSeries = (book: Book) => {
    return series.find(s => s.bookIds.includes(book.id))
  }

  // Filter management functions
  const addFilter = (type: 'tag' | 'series' | 'status', id: string, name: string, color: string, icon: string) => {
    // Check if filter already exists
    const exists = activeFilters.some(filter => filter.type === type && filter.id === id)
    if (!exists) {
      setActiveFilters(prev => [...prev, { type, id, name, color, icon }])
    }
  }

  const removeFilter = (type: 'tag' | 'series' | 'status', id: string) => {
    setActiveFilters(prev => prev.filter(filter => !(filter.type === type && filter.id === id)))
  }

  const clearAllFilters = () => {
    setActiveFilters([])
  }

  const toggleFilterSection = (section: 'tags' | 'series' | 'status') => {
    setExpandedFilterSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const ownedCount = books.filter(book => book.status === 'owned').length
  const wishlistCount = books.filter(book => book.status === 'wishlist').length

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
        let dateA, dateB
        try {
          dateA = new Date(a.dateAdded + 'T12:00:00')
          dateB = new Date(b.dateAdded + 'T12:00:00')
          
          // Validate that the dates are valid
          if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
            throw new Error('Invalid date')
          }
        } catch (error) {
          // If date parsing fails, use current date
          dateA = new Date()
          dateB = new Date()
        }
        
        comparison = dateA.getTime() - dateB.getTime()
        
        // Debug logging - with safe date conversion
        console.log(`Sorting: ${a.title} (${a.dateAdded}) vs ${b.title} (${b.dateAdded})`)
        console.log(`Date A: ${isNaN(dateA.getTime()) ? 'Invalid Date' : dateA.toISOString()}, Date B: ${isNaN(dateB.getTime()) ? 'Invalid Date' : dateB.toISOString()}`)
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
  
  // Advanced filtering logic
  const filteredBooks = sortedBooks.filter(book => {
    const bookTags = getBookTags(book)
    const bookSeries = getBookSeries(book)
    const bookStatus = getStatusInfo(book.status)
    
    // Check if search term matches title, author, tag names, or series names
    const matchesSearch = 
      !searchTerm || 
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bookTags.some(tag => tag.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (bookSeries && bookSeries.name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    // Check if book matches all active filters
    const matchesAllFilters = activeFilters.every(filter => {
      switch (filter.type) {
        case 'tag':
          return bookTags.some(tag => tag.id === filter.id)
        case 'series':
          return bookSeries && bookSeries.id === filter.id
        case 'status':
          return bookStatus.id === filter.id
        default:
          return true
      }
    })
    
    return matchesSearch && matchesAllFilters
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Minimal Header */}
      <header className="bg-white border-b border-gray-100 safe-area-top">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Book Tracker</h1>
              <p className="text-xs text-gray-500">
                {books.length > 0 ? `${ownedCount} owned, ${books.length} total` : 'No books yet'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => router.push('/add')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                title="Add Book"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push('/settings')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="bg-white border-b border-gray-100">
        <div className="px-4 py-3">
          {/* Search Bar */}
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search books..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-sm hover:shadow-md transition-all duration-200"
              />
            </div>
            
            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md flex-shrink-0 ${
                activeFilters.length > 0
                  ? 'bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {activeFilters.length > 0 && (
                <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center font-medium">
                  {activeFilters.length}
                </span>
              )}
            </button>
          </div>
          
          {/* Active Filters Display */}
          {activeFilters.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Active Filters</span>
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-red-600 hover:text-red-700 font-medium hover:bg-red-50 px-2 py-1 rounded transition-colors"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeFilters.map((filter) => (
                  <span
                    key={`${filter.type}-${filter.id}`}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-${filter.color}-100 text-${filter.color}-700 border border-${filter.color}-200`}
                  >
                    <span className="text-xs">{filter.icon}</span>
                    <span>{filter.name}</span>
                    <button
                      onClick={() => removeFilter(filter.type, filter.id)}
                      className="ml-1 hover:bg-red-100 rounded-full p-0.5 transition-colors"
                      title="Remove filter"
                    >
                      <X className="w-3 h-3 text-red-600" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Filter Panel */}
      {showFilterPanel && (
        <div className="bg-white border-b border-gray-100">
          <div className="px-4 py-4">
            <div className="space-y-4">
              {/* Status Filters */}
              <div className="space-y-2">
                <button
                  onClick={() => toggleFilterSection('status')}
                  className="flex items-center justify-between w-full text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">Status</span>
                    <span className="text-xs text-gray-500">({statusOptions.length})</span>
                  </div>
                  {expandedFilterSections.status ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                
                {expandedFilterSections.status && (
                  <div className="flex flex-wrap gap-2">
                    {statusOptions.map((status) => {
                      const isActive = activeFilters.some(f => f.type === 'status' && f.id === status.id)
                      return (
                        <button
                          key={status.id}
                          onClick={() => {
                            if (isActive) {
                              removeFilter('status', status.id)
                            } else {
                              addFilter('status', status.id, status.name, status.color, status.icon)
                            }
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                            isActive
                              ? `bg-${status.color}-100 text-${status.color}-700 border border-${status.color}-200`
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <span className="text-xs">{status.icon}</span>
                          <span>{status.name}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Tag Filters */}
              {tags.length > 0 && (
                <div className="space-y-2">
                  <button
                    onClick={() => toggleFilterSection('tags')}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">Tags</span>
                      <span className="text-xs text-gray-500">({tags.length})</span>
                    </div>
                    {expandedFilterSections.tags ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  
                  {expandedFilterSections.tags && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => {
                        const isActive = activeFilters.some(f => f.type === 'tag' && f.id === tag.id)
                        return (
                          <button
                            key={tag.id}
                            onClick={() => {
                              if (isActive) {
                                removeFilter('tag', tag.id)
                              } else {
                                addFilter('tag', tag.id, tag.name, tag.color, tag.icon)
                              }
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                              isActive
                                ? `bg-${tag.color}-100 text-${tag.color}-700 border border-${tag.color}-200`
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <span className="text-xs">{tag.icon}</span>
                            <span>{tag.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Series Filters */}
              {series.length > 0 && (
                <div className="space-y-2">
                  <button
                    onClick={() => toggleFilterSection('series')}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">Series</span>
                      <span className="text-xs text-gray-500">({series.length})</span>
                    </div>
                    {expandedFilterSections.series ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  
                  {expandedFilterSections.series && (
                    <div className="flex flex-wrap gap-2">
                      {series.map((seriesItem) => {
                        const isActive = activeFilters.some(f => f.type === 'series' && f.id === seriesItem.id)
                        return (
                          <button
                            key={seriesItem.id}
                            onClick={() => {
                              if (isActive) {
                                removeFilter('series', seriesItem.id)
                              } else {
                                addFilter('series', seriesItem.id, seriesItem.name, seriesItem.color, seriesItem.icon)
                              }
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                              isActive
                                ? `bg-${seriesItem.color}-100 text-${seriesItem.color}-700 border border-${seriesItem.color}-200`
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <span className="text-xs">{seriesItem.icon}</span>
                            <span>{seriesItem.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content - Full page scroll */}
      <div className="px-3 sm:px-6 py-3 sm:py-4">
        {loading ? (
          <div className="text-center py-8 sm:py-12">
            <div className="spinner h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base">Loading your library...</p>
          </div>
        ) : (searchTerm && activeFilters.length === 0) ? (
          // Search Results (only when no filters are active)
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
              {isSearching ? 'Searching...' : 'Search Results'}
            </h3>
            
            {/* Your Library Results - Show First */}
            {filteredBooks.length > 0 && (
              <div className="space-y-2 sm:space-y-3">
                <h4 className="text-xs sm:text-base font-medium text-gray-700">In Your Library:</h4>
                {filteredBooks.map((book) => (
                  <div 
                    key={book.id}
                    onClick={() => router.push(`/book/${book.id}`)}
                    className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 cursor-pointer hover:bg-green-100 hover:border-green-300 transition-all"
                  >
                    <div className="flex gap-3 sm:gap-4">
                      {book.cover ? (
                        <img 
                          src={getImprovedCoverUrl(book.cover)} 
                          alt={book.title}
                          className="w-16 h-24 sm:w-20 sm:h-32 object-cover rounded-lg flex-shrink-0 shadow-md hover:shadow-lg transition-shadow"
                          style={{
                            imageRendering: 'crisp-edges'
                          }}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            // Fallback to original URL if improved URL fails
                            const target = e.target as HTMLImageElement
                            if (target.src !== book.cover && book.cover) {
                              target.src = book.cover
                            } else {
                              // Fallback to placeholder if both fail
                              target.style.display = 'none'
                              target.nextElementSibling?.classList.remove('hidden')
                            }
                          }}
                        />
                      ) : (
                        <div className="w-16 h-24 sm:w-20 sm:h-32 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                          <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                          <h5 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{book.title}</h5>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-2 truncate">{book.author}</p>
                        <span className="inline-flex items-center px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                          ✓ You own this
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Google Books Results - Show Second */}
            {searchResults.length > 0 && (
              <div className="space-y-2 sm:space-y-3">
                <h4 className="text-xs sm:text-base font-medium text-gray-700">Add to Library:</h4>
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
                      className={`rounded-lg p-3 sm:p-4 shadow-sm border cursor-pointer hover:shadow-md transition-shadow ${
                        existingBook 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex gap-3 sm:gap-4">
                        {book.volumeInfo.imageLinks?.thumbnail ? (
                          <img 
                            src={book.volumeInfo.imageLinks.thumbnail} 
                            alt={book.volumeInfo.title}
                            className="w-16 h-24 sm:w-20 sm:h-32 object-cover rounded-lg flex-shrink-0 shadow-md hover:shadow-lg transition-shadow"
                          />
                        ) : (
                          <div className="w-16 h-24 sm:w-20 sm:h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{book.volumeInfo.title}</h5>
                            {existingBook && (
                              <span className="inline-flex items-center px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-full flex-shrink-0">
                                <Check className="w-3 h-3 mr-1" />
                                Owned
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 mb-2 truncate">
                            {book.volumeInfo.authors?.join(', ') || 'Unknown Author'}
                          </p>
                          <button className={`text-xs sm:text-sm font-medium ${
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

            {!isSearching && searchResults.length === 0 && filteredBooks.length === 0 && (
              <div className="text-center py-6 sm:py-8">
                <BookOpen className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-gray-400" />
                <p className="text-gray-600 text-sm sm:text-base">No books found</p>
                <p className="text-xs sm:text-sm text-gray-500">Try a different search term</p>
              </div>
            )}
          </div>
        ) : (
          // Library View
          <div>
            {filteredBooks.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <BookOpen className="w-8 h-8 sm:w-12 sm:h-12 text-blue-600" />
                </div>
                {activeFilters.length > 0 ? (
                  <>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">No Books Found</h3>
                    <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-lg">No books match your current filters</p>
                    <button
                      onClick={clearAllFilters}
                      className="inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-0.5 transition-all duration-200 active:scale-95 text-sm sm:text-base"
                    >
                      Clear All Filters
                    </button>
                  </>
                ) : books.length === 0 ? (
                  <>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Start Your Library</h3>
                    <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-lg">Add your first book to get started</p>
                    <button
                      onClick={() => router.push('/add')}
                      className="inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-0.5 transition-all duration-200 active:scale-95 text-sm sm:text-base"
                    >
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                      Add Your First Book
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">No Books Found</h3>
                    <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-lg">No books match your search criteria</p>
                    <button
                      onClick={() => setSearchTerm('')}
                      className="inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-0.5 transition-all duration-200 active:scale-95 text-sm sm:text-base"
                    >
                      Clear Search
                    </button>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Results Summary */}
                {activeFilters.length > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Showing {filteredBooks.length} book{filteredBooks.length !== 1 ? 's' : ''} 
                      {activeFilters.length > 0 && (
                        <span> matching {activeFilters.length} filter{activeFilters.length !== 1 ? 's' : ''}</span>
                      )}
                    </p>
                  </div>
                )}

                {/* Sorting and View Controls */}
                <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {/* Sort By Dropdown */}
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'dateAdded' | 'title' | 'author')}
                        className="appearance-none pl-3 pr-8 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <option value="dateAdded">Date Added</option>
                        <option value="title">Title</option>
                        <option value="author">Author</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Sort Order Toggle */}
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className={`p-2 text-xs sm:text-sm border rounded-lg transition-all duration-200 shadow-sm hover:shadow-md ${
                        sortOrder === 'asc' 
                          ? 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200' 
                          : 'bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200'
                      }`}
                      title={sortOrder === 'asc' ? 'Sort Descending' : 'Sort Ascending'}
                    >
                      {sortOrder === 'asc' ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* View Mode Toggle */}
                    <button
                      onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                      className={`p-2 text-xs sm:text-sm border rounded-lg transition-all duration-200 shadow-sm hover:shadow-md ${
                        viewMode === 'grid' 
                          ? 'bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200' 
                          : 'bg-orange-100 border-orange-300 text-orange-700 hover:bg-orange-200'
                      }`}
                      title={viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
                    >
                      {viewMode === 'grid' ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4' : 'space-y-2 sm:space-y-3'}>
                {filteredBooks.map((book) => (
                  <div 
                    key={book.id}
                    onClick={() => router.push(`/book/${book.id}`)}
                    className={`bg-white rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all ${
                      viewMode === 'grid' ? 'p-2 sm:p-3' : 'p-3 sm:p-4'
                    }`}
                  >
                    {viewMode === 'grid' ? (
                      // Grid View - Optimized for mobile
                      <div className="text-center">
                        {book.cover ? (
                          <img 
                            src={getImprovedCoverUrl(book.cover)} 
                            alt={book.title}
                            className="w-full h-56 sm:h-72 object-contain rounded-lg mb-2 sm:mb-3 shadow-md hover:shadow-lg transition-shadow bg-white"
                            style={{ 
                              aspectRatio: '2/3',
                              imageRendering: 'crisp-edges'
                            }}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              // Fallback to original URL if improved URL fails
                              const target = e.target as HTMLImageElement
                              if (target.src !== book.cover && book.cover) {
                                target.src = book.cover
                              } else {
                                // Fallback to placeholder if both fail
                                target.style.display = 'none'
                                target.nextElementSibling?.classList.remove('hidden')
                              }
                            }}
                          />
                        ) : (
                          <div 
                            className="w-full h-56 sm:h-72 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center mb-2 sm:mb-3 shadow-md"
                            style={{ aspectRatio: '2/3' }}
                          >
                            <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                          </div>
                        )}
                        <h5 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base truncate">{book.title}</h5>
                        <p className="text-xs text-gray-600 mb-2 truncate">{book.author}</p>
                        {(() => {
                          const status = getStatusInfo(book.status)
                          return (
                            <span className={`inline-flex items-center px-1.5 py-0.5 text-xs rounded-full font-medium ${
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
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-${tag.color}-100 text-${tag.color}-800 border border-${tag.color}-200`}
                                >
                                  <span className="text-xs">{tag.icon}</span>
                                  <span className="truncate">{tag.name}</span>
                                </span>
                              ))}
                              {bookTags.length > 2 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                  +{bookTags.length - 2}
                                </span>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    ) : (
                      // List View - Optimized for mobile
                      <div className="flex gap-3 sm:gap-5">
                        {book.cover ? (
                          <img 
                            src={getImprovedCoverUrl(book.cover)} 
                            alt={book.title}
                            className="w-16 h-28 sm:w-20 sm:h-36 object-contain rounded-lg flex-shrink-0 shadow-md hover:shadow-lg transition-shadow bg-white"
                            style={{ 
                              aspectRatio: '2/3',
                              imageRendering: 'crisp-edges'
                            }}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              // Fallback to original URL if improved URL fails
                              const target = e.target as HTMLImageElement
                              if (target.src !== book.cover && book.cover) {
                                target.src = book.cover
                              } else {
                                // Fallback to placeholder if both fail
                                target.style.display = 'none'
                                target.nextElementSibling?.classList.remove('hidden')
                              }
                            }}
                          />
                        ) : (
                          <div 
                            className="w-16 h-28 sm:w-20 sm:h-36 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md"
                            style={{ aspectRatio: '2/3' }}
                          >
                            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h5 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-lg truncate">{book.title}</h5>
                          <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 truncate">{book.author}</p>
                          {(() => {
                            const status = getStatusInfo(book.status)
                            return (
                              <span className={`inline-flex items-center px-2 py-1 text-xs sm:text-sm rounded-full font-medium ${
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
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-${tag.color}-100 text-${tag.color}-800 border border-${tag.color}-200`}
                                  >
                                    <span className="text-xs">{tag.icon}</span>
                                    <span className="truncate">{tag.name}</span>
                                  </span>
                                ))}
                                {bookTags.length > 3 && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
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
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 