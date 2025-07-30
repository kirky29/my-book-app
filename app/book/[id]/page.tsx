'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Edit3, Save, X, Trash2, Check, BookOpen, Calendar, Heart, CheckCircle, User, Building, Globe, Hash, Clock, Star, Share2, ExternalLink, Bookmark, Eye, EyeOff, Download, Copy, MoreHorizontal, ChevronRight, Tag, Award, Users, MapPin, Phone, Mail, Link, Info, AlertCircle } from 'lucide-react'
import { useBooks } from '../../contexts/BookContext'
import { useStatusOptions } from '../../contexts/StatusOptionsContext'
import { useSeries } from '../../contexts/SeriesContext'
import { useTags } from '../../contexts/TagsContext'
import StatusSelector from '../../components/StatusSelector'
import TagSelector from '../../components/TagSelector'

export default function BookDetail() {
  const router = useRouter()
  const params = useParams()
  const { getBook, updateBook, deleteBook } = useBooks()
  const { statusOptions } = useStatusOptions()
  const { series, getSeriesForBook, addBookToSeries, removeBookFromSeries } = useSeries()
  const { tags } = useTags()
  const book = getBook(params.id as string)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showStatusSelector, setShowStatusSelector] = useState(false)
  const [tempStatus, setTempStatus] = useState<string>('')
  const [showSeriesSelector, setShowSeriesSelector] = useState(false)
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('')
  const [bookTags, setBookTags] = useState<string[]>(book?.tagIds || [])

  if (!book) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white safe-area-top">
          <div className="flex items-center gap-3 px-6 py-4">
            <button 
              onClick={() => router.back()} 
              className="p-3 hover:bg-white/10 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold">Book Not Found</h1>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Book Not Found</h2>
            <p className="text-gray-600 mb-6">This book could not be found in your library.</p>
            <button 
              onClick={() => router.push('/')} 
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2 inline" />
              Back to Library
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleStatusChange = async () => {
    if (!book || !tempStatus) return
    
    try {
      await updateBook(book.id, { status: tempStatus })
      setShowStatusSelector(false)
      setTempStatus('')
    } catch (error) {
      console.error('Error updating book status:', error)
      alert('Failed to update book status. Please try again.')
    }
  }

  const openStatusSelector = () => {
    setTempStatus(book.status)
    setShowStatusSelector(true)
  }

  const openSeriesSelector = () => {
    const currentSeries = getSeriesForBook(book.id)
    setSelectedSeriesId(currentSeries?.id || '')
    setShowSeriesSelector(true)
  }

  const handleSeriesChange = async () => {
    if (!book) return
    
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
      
      setShowSeriesSelector(false)
      setSelectedSeriesId('')
    } catch (error) {
      console.error('Error updating book series:', error)
      alert('Failed to update book series. Please try again.')
    }
  }

  const handleTagsChange = async (newTagIds: string[]) => {
    if (!book) return
    
    try {
      await updateBook(book.id, { tagIds: newTagIds })
      setBookTags(newTagIds)
    } catch (error) {
      console.error('Error updating book tags:', error)
      alert('Failed to update book tags. Please try again.')
    }
  }

  // Helper function to get status info
  const getStatusInfo = (statusId: string) => {
    const status = statusOptions.find(s => s.id === statusId)
    return status || { name: 'Unknown', color: 'gray', icon: '❓' }
  }

  const handleDeleteBook = async () => {
    if (!book) return
    
    try {
      await deleteBook(book.id)
      router.push('/')
    } catch (error) {
      console.error('Error deleting book:', error)
      alert('Failed to delete book. Please try again.')
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white safe-area-top">
        <div className="flex items-center gap-3 px-4 sm:px-6 py-4">
          <button 
            onClick={() => router.back()} 
            className="p-3 hover:bg-white/10 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg sm:text-xl font-semibold">Book Details</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Hero Section with Cover and Basic Info */}
        <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white px-4 sm:px-6 py-8">
          <div className="flex gap-6 items-start">
            {/* Book Cover */}
            <div className="flex-shrink-0">
              {book.cover ? (
                <img 
                  src={book.cover} 
                  alt={book.title}
                  className="w-32 h-48 sm:w-40 sm:h-56 object-cover rounded-2xl shadow-2xl border-4 border-white/20"
                />
              ) : (
                <div className="w-32 h-48 sm:w-40 sm:h-56 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-2xl border-4 border-white/20">
                  <BookOpen className="w-16 h-16 text-white/70" />
                </div>
              )}
            </div>

            {/* Book Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-white/80">In Your Library</span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 leading-tight">
                {book.title}
              </h1>
              
              <p className="text-lg sm:text-xl text-white/90 mb-4">
                by {book.author}
              </p>

              {/* Status and Series Badges */}
              <div className="flex flex-wrap gap-3 mb-6">
                {/* Status Badge */}
                {(() => {
                  const statusInfo = getStatusInfo(book.status)
                  return (
                    <button
                      onClick={openStatusSelector}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all cursor-pointer"
                    >
                      <span className="text-base">{statusInfo.icon}</span>
                      {statusInfo.name}
                      <Edit3 className="w-3 h-3 opacity-70" />
                    </button>
                  )
                })()}

                {/* Series Badge */}
                {(() => {
                  const bookSeries = getSeriesForBook(book.id)
                  if (bookSeries) {
                    return (
                      <button
                        onClick={openSeriesSelector}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all cursor-pointer"
                      >
                        <span className="text-base">{bookSeries.icon || '📚'}</span>
                        {bookSeries.name}
                        <Edit3 className="w-3 h-3 opacity-70" />
                      </button>
                    )
                  } else {
                    return (
                      <button
                        onClick={openSeriesSelector}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all cursor-pointer"
                      >
                        <span className="text-base">📚</span>
                        Add to Series
                        <Edit3 className="w-3 h-3 opacity-70" />
                      </button>
                    )
                  }
                })()}
              </div>

              {/* Quick Stats */}
              <div className="flex gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-white/70" />
                  <span className="text-white/80">Added {book.dateAdded}</span>
                </div>
                {book.isbn && (
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-white/70" />
                    <span className="text-white/80 font-mono">ISBN: {book.isbn}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 sm:px-6 py-6 space-y-6">
          {/* Book Details */}
          <div className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Book Details</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Author */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <User className="w-4 h-4" />
                  <span>Author</span>
                </div>
                <p className="font-semibold text-gray-900">{book.author}</p>
              </div>

              {/* Publisher */}
              {book.publisher && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Building className="w-4 h-4" />
                    <span>Publisher</span>
                  </div>
                  <p className="font-semibold text-gray-900">{book.publisher}</p>
                </div>
              )}

              {/* Published Date */}
              {book.publishedDate && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>Published</span>
                  </div>
                  <p className="font-semibold text-gray-900">{book.publishedDate}</p>
                </div>
              )}

              {/* Page Count */}
              {book.pageCount && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <BookOpen className="w-4 h-4" />
                    <span>Pages</span>
                  </div>
                  <p className="font-semibold text-gray-900">{book.pageCount.toLocaleString()}</p>
                </div>
              )}

              {/* Language */}
              {book.language && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Globe className="w-4 h-4" />
                    <span>Language</span>
                  </div>
                  <p className="font-semibold text-gray-900">{book.language.toUpperCase()}</p>
                </div>
              )}

              {/* Edition */}
              {book.edition && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Award className="w-4 h-4" />
                    <span>Edition</span>
                  </div>
                  <p className="font-semibold text-gray-900">{book.edition}</p>
                </div>
              )}
            </div>
          </div>

          {/* Book Tags */}
          <div className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl p-6 shadow-sm relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Tag className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Tags</h3>
            </div>
            
            <TagSelector
              selectedTagIds={bookTags}
              onTagsChange={handleTagsChange}
              className="w-full"
            />
          </div>

          {/* Book Description */}
          <div className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Description</h3>
            </div>
            {book.description ? (
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {book.description}
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-purple-600" />
                </div>
                <p className="text-gray-500 mb-4">No description available for this book.</p>
                <p className="text-sm text-gray-400">
                  Descriptions are automatically added when books are found through search or ISBN scanning.
                </p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <Share2 className="w-5 h-5 text-blue-600" />
                <span className="text-gray-900 text-sm">Share Book</span>
              </button>
              
              <button className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <ExternalLink className="w-5 h-5 text-green-600" />
                <span className="text-gray-900 text-sm">Find Online</span>
              </button>
              
              <button className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <Copy className="w-5 h-5 text-purple-600" />
                <span className="text-gray-900 text-sm">Copy ISBN</span>
              </button>
              
              <button className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <Download className="w-5 h-5 text-orange-600" />
                <span className="text-gray-900 text-sm">Export Data</span>
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white/90 backdrop-blur-sm border border-red-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-red-900 mb-4">Danger Zone</h3>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center gap-3 p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5 text-red-600" />
              <span className="text-red-900">Remove from Library</span>
            </button>
          </div>

          {/* Back to Library Button */}
          <div className="text-center">
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Library
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Remove Book?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to remove <span className="font-semibold">"{book.title}"</span> from your library? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteBook}
                  className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2 inline" />
                  Remove Book
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Selector Modal */}
      {showStatusSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Change Book Status</h3>
              <button
                onClick={() => {
                  setShowStatusSelector(false)
                  setTempStatus('')
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">Select a new status for "{book.title}":</p>
              <StatusSelector
                selectedStatus={tempStatus}
                onStatusChange={setTempStatus}
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowStatusSelector(false)
                  setTempStatus('')
                }}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusChange}
                disabled={!tempStatus || tempStatus === book.status}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Series Selector Modal */}
      {showSeriesSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Assign to Series</h3>
              <button
                onClick={() => {
                  setShowSeriesSelector(false)
                  setSelectedSeriesId('')
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">Select a series for "{book.title}":</p>
              
              {series.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No series created yet.</p>
                  <button
                    onClick={() => router.push('/settings')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Series in Settings
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="series"
                      value=""
                      checked={selectedSeriesId === ''}
                      onChange={(e) => setSelectedSeriesId(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-900">No Series</span>
                  </label>
                  
                  {series.map((seriesItem) => (
                    <label key={seriesItem.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="series"
                        value={seriesItem.id}
                        checked={selectedSeriesId === seriesItem.id}
                        onChange={(e) => setSelectedSeriesId(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{seriesItem.icon || '📚'}</span>
                        <div>
                          <span className="text-gray-900 font-medium">{seriesItem.name}</span>
                          {seriesItem.description && (
                            <p className="text-sm text-gray-600">{seriesItem.description}</p>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSeriesSelector(false)
                  setSelectedSeriesId('')
                }}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSeriesChange}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 