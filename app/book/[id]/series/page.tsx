'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Check, Plus } from 'lucide-react'
import { useBooks } from '../../../contexts/BookContext'
import { useSeries, Series } from '../../../contexts/SeriesContext'

export default function AssignToSeries() {
  const router = useRouter()
  const params = useParams()
  const { getBook, updateBook } = useBooks()
  const { series, getSeriesForBook, addBookToSeries, removeBookFromSeries } = useSeries()
  const book = getBook(params.id as string)
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('')
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (book) {
      const currentSeries = getSeriesForBook(book.id)
      setSelectedSeriesId(currentSeries?.id || '')
    }
  }, [book, getSeriesForBook])

  useEffect(() => {
    if (!book) {
      router.push('/')
    }
  }, [book, router])

  if (!book) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-600">Book not found.</p>
          </div>
        </div>
      </div>
    )
  }

  const handleSeriesChange = async () => {
    if (!book) return
    
    setIsUpdating(true)
    try {
      const currentSeries = getSeriesForBook(book.id)
      
      // Remove from current series if exists
      if (currentSeries) {
        await removeBookFromSeries(currentSeries.id, book.id)
      }
      
      // Add to new series if selected
      if (selectedSeriesId) {
        await addBookToSeries(selectedSeriesId, book.id)
      }
      
      router.back()
    } catch (error) {
      console.error('Error updating book series:', error)
      alert('Failed to update book series. Please try again.')
      setIsUpdating(false)
    }
  }

  const currentSeries = getSeriesForBook(book.id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 safe-area-top">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()} 
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Assign to Series</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-6">
        <div className="max-w-md mx-auto">
          {/* Book Info */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{book.title}</h2>
              <p className="text-gray-600">by {book.author}</p>
            </div>
          </div>

          {/* Series Options */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Series</h3>
            
            <div className="space-y-2">
              {/* No Series Option */}
              <button
                onClick={() => setSelectedSeriesId('')}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  selectedSeriesId === '' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-2xl">📚</span>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">No Series</p>
                    <p className="text-sm text-gray-500">Remove from series</p>
                  </div>
                </div>
                
                {selectedSeriesId === '' && (
                  <Check className="w-5 h-5 text-blue-600" />
                )}
              </button>

              {/* Series Options */}
              {series.map((seriesItem) => {
                const isSelected = selectedSeriesId === seriesItem.id
                const isCurrent = currentSeries?.id === seriesItem.id
                
                return (
                  <button
                    key={seriesItem.id}
                    onClick={() => setSelectedSeriesId(seriesItem.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">{seriesItem.icon || '📚'}</span>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{seriesItem.name}</p>
                        {seriesItem.description && (
                          <p className="text-sm text-gray-600">{seriesItem.description}</p>
                        )}
                        {isCurrent && (
                          <p className="text-sm text-gray-500">Current series</p>
                        )}
                      </div>
                    </div>
                    
                    {isSelected && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* No Series Available */}
            {series.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No Series Created</h4>
                <p className="text-gray-600 mb-6">Create your first series to organize related books together.</p>
                <button
                  onClick={() => router.push('/settings')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Create Series in Settings
                </button>
              </div>
            )}

            {/* Create New Series Button */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => router.push('/settings?tab=series&action=add')}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span className="font-medium">Create New Series</span>
              </button>
            </div>

            {/* Action Buttons */}
            {series.length > 0 && (
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => router.back()}
                  disabled={isUpdating}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSeriesChange}
                  disabled={isUpdating}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isUpdating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 