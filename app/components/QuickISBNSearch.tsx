'use client'

import { useState } from 'react'
import { Search, X, BookOpen, Plus, AlertTriangle, CheckCircle } from 'lucide-react'
import { useBooks } from '../contexts/BookContext'

interface QuickISBNSearchProps {
  onBookFound?: (book: any) => void
  onClose?: () => void
}

export default function QuickISBNSearch({ onBookFound, onClose }: QuickISBNSearchProps) {
  const [isbn, setISBN] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [existingBooks, setExistingBooks] = useState<any[]>([])
  const [duplicates, setDuplicates] = useState<any[]>([])
  const { getBooksByISBN, searchByISBN, findSimilarBooks } = useBooks()

  const handleSearch = async () => {
    if (!isbn.trim()) return
    
    setIsSearching(true)
    setResult(null)
    setExistingBooks([])
    setDuplicates([])
    
    // Check if we already own this exact ISBN
    const ownedWithISBN = getBooksByISBN(isbn)
    if (ownedWithISBN.length > 0) {
      setExistingBooks(ownedWithISBN)
      setIsSearching(false)
      return
    }
    
    // Search Google Books
    const googleBook = await searchByISBN(isbn)
    if (googleBook) {
      const title = googleBook.volumeInfo.title
      const author = googleBook.volumeInfo.authors?.[0] || 'Unknown'
      
      // Check for similar books (different editions, formats, etc.)
      const similarBooks = findSimilarBooks(title, author, isbn, googleBook.volumeInfo.publisher)
      if (similarBooks.length > 0) {
        setDuplicates(similarBooks.map(result => result.book))
      }
      
      setResult(googleBook)
    } else {
      setResult(null)
    }
    
    setIsSearching(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const addToLibrary = () => {
    if (result && onBookFound) {
      onBookFound(result)
    }
  }

  const clearSearch = () => {
    setISBN('')
    setResult(null)
    setExistingBooks([])
    setDuplicates([])
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

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Quick ISBN Check</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Enter ISBN
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="978-0-123456-78-9 or 0123456789"
                value={isbn}
                onChange={(e) => setISBN(e.target.value)}
                onKeyPress={handleKeyPress}
                className="input pr-20"
                autoFocus
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-1">
                {isbn && (
                  <button
                    onClick={clearSearch}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={handleSearch}
                  disabled={isSearching || !isbn.trim()}
                  className="p-1 text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                >
                  {isSearching ? (
                    <div className="spinner h-4 w-4" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter the 10 or 13-digit ISBN from the back of the book
            </p>
          </div>

          {/* Exact ISBN Match Found */}
          {existingBooks.length > 0 && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-800 mb-2">
                    You already own this exact book!
                  </h3>
                  {existingBooks.map(book => (
                    <div key={book.id} className="mb-2 p-3 bg-white rounded border">
                      <div className="flex gap-3">
                        {book.cover && (
                          <img 
                            src={getImprovedCoverUrl(book.cover)} 
                            alt={book.title}
                            className="w-10 h-14 object-cover rounded flex-shrink-0"
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
                              }
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">{book.title}</h4>
                          <p className="text-xs text-gray-600 mb-1">{book.author}</p>
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                            book.status === 'both' ? 'bg-purple-100 text-purple-800' :
                            book.status === 'physical' ? 'bg-green-100 text-green-800' :
                            book.status === 'digital' ? 'bg-blue-100 text-blue-800' :
                            book.status === 'wishlist' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {book.status === 'both' ? 'Physical & Digital' : 
                             book.status === 'physical' ? 'Physical Copy' :
                             book.status === 'digital' ? 'Digital Copy' :
                             book.status === 'wishlist' ? 'On Wishlist' :
                             book.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Similar Books Found (Different Editions) */}
          {duplicates.length > 0 && result && (
            <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-orange-800 mb-2">
                    Similar books found in your library
                  </h3>
                  <p className="text-sm text-orange-700 mb-3">
                    You might already have this book in a different format or edition:
                  </p>
                  {duplicates.map(book => (
                    <div key={book.id} className="mb-2 p-3 bg-white rounded border">
                      <div className="flex gap-3">
                        {book.cover && (
                          <img 
                            src={getImprovedCoverUrl(book.cover)} 
                            alt={book.title}
                            className="w-10 h-14 object-cover rounded flex-shrink-0"
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
                              }
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">{book.title}</h4>
                          <p className="text-xs text-gray-600 mb-1">{book.author}</p>
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                            book.status === 'both' ? 'bg-purple-100 text-purple-800' :
                            book.status === 'physical' ? 'bg-green-100 text-green-800' :
                            book.status === 'digital' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {book.status === 'both' ? 'Physical & Digital' : 
                             book.status === 'physical' ? 'Physical Copy' :
                             book.status === 'digital' ? 'Digital Copy' :
                             book.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* New Book Found */}
          {result && existingBooks.length === 0 && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-800 mb-2">
                    {duplicates.length > 0 ? 
                      'Book found - Different edition' : 
                      'Book found - Not in your library'
                    }
                  </h3>
                  <div className="flex gap-3 mb-3">
                    {result.volumeInfo.imageLinks?.thumbnail && (
                      <img 
                        src={`https://books.google.com/books/publisher/content/images/frontcover/${result.id}?fife=w200-h300&source=gbs_api`} 
                        alt={result.volumeInfo.title}
                        className="w-12 h-16 object-cover rounded flex-shrink-0"
                        style={{
                          imageRendering: 'crisp-edges'
                        }}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          // Fallback to thumbnail if high-res image fails
                          const target = e.target as HTMLImageElement
                          target.src = result.volumeInfo.imageLinks?.thumbnail || ''
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{result.volumeInfo.title}</h4>
                      <p className="text-sm text-gray-600 mb-1">
                        {result.volumeInfo.authors?.join(', ') || 'Unknown Author'}
                      </p>
                      {result.volumeInfo.publishedDate && (
                        <p className="text-xs text-gray-500">
                          Published: {result.volumeInfo.publishedDate}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={addToLibrary}
                    className="btn btn-primary w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Library
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* No Results */}
          {!result && !existingBooks.length && isbn && !isSearching && (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <h3 className="font-medium text-gray-700 mb-1">No book found</h3>
              <p className="text-sm">
                No book found with ISBN: <span className="font-mono">{isbn}</span>
              </p>
              <p className="text-xs mt-2">
                Try checking the ISBN again or add the book manually
              </p>
            </div>
          )}

          {/* Quick Tips */}
          {!isbn && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Quick Tips:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• ISBN is usually on the back cover near the barcode</li>
                <li>• Can be 10 or 13 digits (hyphens are optional)</li>
                <li>• Perfect for checking books while shopping!</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 