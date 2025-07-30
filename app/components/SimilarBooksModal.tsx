'use client'

import React from 'react'
import { X, AlertTriangle, CheckCircle, Info, BookOpen, Star } from 'lucide-react'
import { useBooks } from '../contexts/BookContext'

interface SimilarityResult {
  book: {
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
  similarityScore: number
  matchType: 'exact_isbn' | 'similar_title_author' | 'similar_title' | 'same_author_series' | 'edition_variant'
  reasons: string[]
}

interface SimilarBooksModalProps {
  isOpen: boolean
  onClose: () => void
  onAddAnyway: () => void
  similarBooks: SimilarityResult[]
  newBookTitle: string
  newBookAuthor: string
}

export default function SimilarBooksModal({
  isOpen,
  onClose,
  onAddAnyway,
  similarBooks,
  newBookTitle,
  newBookAuthor
}: SimilarBooksModalProps) {
  if (!isOpen) return null

  const getMatchTypeIcon = (matchType: SimilarityResult['matchType']) => {
    switch (matchType) {
      case 'exact_isbn':
        return <CheckCircle className="w-5 h-5 text-red-500" />
      case 'similar_title_author':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />
      case 'similar_title':
        return <Info className="w-5 h-5 text-blue-500" />
      case 'same_author_series':
        return <BookOpen className="w-5 h-5 text-purple-500" />
      case 'edition_variant':
        return <Star className="w-5 h-5 text-yellow-500" />
      default:
        return <Info className="w-5 h-5 text-gray-500" />
    }
  }

  const getMatchTypeLabel = (matchType: SimilarityResult['matchType']) => {
    switch (matchType) {
      case 'exact_isbn':
        return 'Exact Match'
      case 'similar_title_author':
        return 'Very Similar'
      case 'similar_title':
        return 'Similar Title'
      case 'same_author_series':
        return 'Same Author'
      case 'edition_variant':
        return 'Edition Variant'
      default:
        return 'Similar'
    }
  }

  const getMatchTypeColor = (matchType: SimilarityResult['matchType']) => {
    switch (matchType) {
      case 'exact_isbn':
        return 'bg-red-50 border-red-200'
      case 'similar_title_author':
        return 'bg-orange-50 border-orange-200'
      case 'similar_title':
        return 'bg-blue-50 border-blue-200'
      case 'same_author_series':
        return 'bg-purple-50 border-purple-200'
      case 'edition_variant':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getSimilarityLevel = (score: number) => {
    if (score >= 0.9) return { level: 'Very High', color: 'text-red-600' }
    if (score >= 0.7) return { level: 'High', color: 'text-orange-600' }
    if (score >= 0.5) return { level: 'Medium', color: 'text-blue-600' }
    if (score >= 0.3) return { level: 'Low', color: 'text-gray-600' }
    return { level: 'Very Low', color: 'text-gray-500' }
  }

  const exactMatches = similarBooks.filter(book => book.matchType === 'exact_isbn')
  const highSimilarity = similarBooks.filter(book => 
    book.matchType !== 'exact_isbn' && book.similarityScore >= 0.7
  )
  const mediumSimilarity = similarBooks.filter(book => 
    book.similarityScore >= 0.5 && book.similarityScore < 0.7
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Similar Books Found</h2>
              <p className="text-blue-100 mt-1">
                We found {similarBooks.length} similar book{similarBooks.length !== 1 ? 's' : ''} in your library
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* New Book Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Book You're Adding:</h3>
            <p className="text-blue-800 font-medium">{newBookTitle}</p>
            <p className="text-blue-700">by {newBookAuthor}</p>
          </div>

          {/* Exact Matches */}
          {exactMatches.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-red-500" />
                Exact Matches ({exactMatches.length})
              </h3>
              <div className="space-y-3">
                {exactMatches.map((result) => (
                  <div key={result.book.id} className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-start gap-4">
                      {result.book.cover ? (
                        <img 
                          src={result.book.cover} 
                          alt={result.book.title}
                          className="w-16 h-24 object-cover rounded-lg flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                            Exact Match
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                            {result.book.status === 'owned' ? 'Owned' : 'Wishlist'}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900">{result.book.title}</h4>
                        <p className="text-gray-600 text-sm">{result.book.author}</p>
                        {result.book.isbn && (
                          <p className="text-gray-500 text-xs mt-1">ISBN: {result.book.isbn}</p>
                        )}
                        <div className="mt-2">
                          {result.reasons.map((reason, index) => (
                            <span key={index} className="inline-block bg-red-100 text-red-700 text-xs px-2 py-1 rounded mr-2 mb-1">
                              {reason}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* High Similarity */}
          {highSimilarity.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Very Similar ({highSimilarity.length})
              </h3>
              <div className="space-y-3">
                {highSimilarity.map((result) => (
                  <div key={result.book.id} className={`${getMatchTypeColor(result.matchType)} border rounded-xl p-4`}>
                    <div className="flex items-start gap-4">
                      {result.book.cover ? (
                        <img 
                          src={result.book.cover} 
                          alt={result.book.title}
                          className="w-16 h-24 object-cover rounded-lg flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                            {getMatchTypeLabel(result.matchType)}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                            {result.book.status === 'owned' ? 'Owned' : 'Wishlist'}
                          </span>
                          <span className={`text-xs font-medium ${getSimilarityLevel(result.similarityScore).color}`}>
                            {Math.round(result.similarityScore * 100)}% match
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900">{result.book.title}</h4>
                        <p className="text-gray-600 text-sm">{result.book.author}</p>
                        {result.book.isbn && (
                          <p className="text-gray-500 text-xs mt-1">ISBN: {result.book.isbn}</p>
                        )}
                        <div className="mt-2">
                          {result.reasons.map((reason, index) => (
                            <span key={index} className="inline-block bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded mr-2 mb-1">
                              {reason}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Medium Similarity */}
          {mediumSimilarity.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-500" />
                Similar ({mediumSimilarity.length})
              </h3>
              <div className="space-y-3">
                {mediumSimilarity.map((result) => (
                  <div key={result.book.id} className={`${getMatchTypeColor(result.matchType)} border rounded-xl p-4`}>
                    <div className="flex items-start gap-4">
                      {result.book.cover ? (
                        <img 
                          src={result.book.cover} 
                          alt={result.book.title}
                          className="w-16 h-24 object-cover rounded-lg flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            {getMatchTypeLabel(result.matchType)}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                            {result.book.status === 'owned' ? 'Owned' : 'Wishlist'}
                          </span>
                          <span className={`text-xs font-medium ${getSimilarityLevel(result.similarityScore).color}`}>
                            {Math.round(result.similarityScore * 100)}% match
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900">{result.book.title}</h4>
                        <p className="text-gray-600 text-sm">{result.book.author}</p>
                        {result.book.isbn && (
                          <p className="text-gray-500 text-xs mt-1">ISBN: {result.book.isbn}</p>
                        )}
                        <div className="mt-2">
                          {result.reasons.map((reason, index) => (
                            <span key={index} className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded mr-2 mb-1">
                              {reason}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-4">
            <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
              <Info className="w-5 h-5 text-green-600" />
              Smart Recommendations
            </h3>
            <div className="space-y-2 text-sm text-green-800">
              {exactMatches.length > 0 && (
                <p>• <strong>Exact matches found:</strong> You may already own this exact book</p>
              )}
              {highSimilarity.length > 0 && (
                <p>• <strong>Very similar books:</strong> These might be different editions or formats</p>
              )}
              {mediumSimilarity.length > 0 && (
                <p>• <strong>Similar books:</strong> These could be related works or series</p>
              )}
              <p>• <strong>Special editions:</strong> Consider if you want multiple editions of the same book</p>
              <p>• <strong>Different formats:</strong> Hardcover, paperback, and digital versions may be worth collecting</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onAddAnyway}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              Add Anyway
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 