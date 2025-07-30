'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Edit3, Save, X, Trash2, Check, BookOpen, Calendar, Heart, CheckCircle, User, Building, Globe, Hash, Clock, Star, Share2, ExternalLink, Bookmark, Eye, EyeOff, Download, Copy, MoreHorizontal, ChevronRight, Tag, Award, Users, MapPin, Phone, Mail, Link, Info, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
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
  const [bookTags, setBookTags] = useState<string[]>(book?.tagIds || [])
  const [showAllBookInfo, setShowAllBookInfo] = useState(false)

  if (!book) {
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
              <h1 className="text-lg font-semibold text-gray-900">Book Details</h1>
            </div>
          </div>
        </header>

        {/* Not Found Content */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Book Not Found</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              This book could not be found in your library. It may have been removed or the link is invalid.
            </p>
            <button 
              onClick={() => router.push('/')} 
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Library
            </button>
          </div>
        </div>
      </div>
    )
  }



  const openStatusSelector = () => {
    router.push(`/book/${book.id}/status`)
  }

  const openSeriesSelector = () => {
    router.push(`/book/${book.id}/series`)
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



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Content */}
      <div className="pb-6">
        {/* Hero Section */}
        <div className="relative bg-white">
          <div className="px-4 pt-4 pb-8">
            {/* Back Button - Floating */}
            <div className="absolute top-4 left-4 z-10">
              <button 
                onClick={() => router.back()} 
                className="p-2 bg-white/90 backdrop-blur-sm text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-8">
              {/* Book Cover - Much Larger */}
              <div className="flex justify-center">
                {book.cover ? (
                  <img 
                    src={book.cover} 
                    alt={book.title}
                    className="w-64 h-96 sm:w-80 sm:h-[28rem] lg:w-96 lg:h-[32rem] object-contain rounded-3xl shadow-xl border border-gray-200 bg-white"
                    style={{
                      imageRendering: '-webkit-optimize-contrast'
                    }}
                    loading="eager"
                    decoding="async"
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      target.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                ) : null}
                {!book.cover && (
                  <div className="w-64 h-96 sm:w-80 sm:h-[28rem] lg:w-96 lg:h-[32rem] bg-gray-100 rounded-3xl flex items-center justify-center shadow-xl border border-gray-200">
                    <BookOpen className="w-24 h-24 sm:w-32 sm:h-32 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Book Info */}
              <div className="text-center max-w-2xl mx-auto">
                {/* Status Indicator */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600 font-medium">In Your Library</span>
                </div>
                
                {/* Title */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight text-gray-900">
                  {book.title}
                </h1>
                
                {/* Author */}
                <p className="text-xl sm:text-2xl text-gray-600 mb-8">
                  by {book.author}
                </p>

                {/* Status and Series Badges */}
                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  {/* Status Badge */}
                  {(() => {
                    const statusInfo = getStatusInfo(book.status)
                    return (
                      <button
                        onClick={openStatusSelector}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-all cursor-pointer"
                      >
                        <span className="text-sm">{statusInfo.icon}</span>
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-all cursor-pointer"
                        >
                          <span className="text-sm">{bookSeries.icon || '📚'}</span>
                          {bookSeries.name}
                          <Edit3 className="w-3 h-3 opacity-70" />
                        </button>
                      )
                    } else {
                      return (
                        <button
                          onClick={openSeriesSelector}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition-all cursor-pointer"
                        >
                          <span className="text-sm">📚</span>
                          Add to Series
                          <Edit3 className="w-3 h-3 opacity-70" />
                        </button>
                      )
                    }
                  })()}
                </div>

                {/* Selected Tags */}
                {bookTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center mb-4">
                    {bookTags.map((tagId) => {
                      const tag = tags.find(t => t.id === tagId)
                      if (!tag) return null
                      
                      // Map color to specific classes to avoid dynamic class issues
                      const getColorClasses = (color: string) => {
                        const colorMap: { [key: string]: string } = {
                          gray: 'bg-gray-50 text-gray-700 border-gray-200',
                          red: 'bg-red-50 text-red-700 border-red-200',
                          orange: 'bg-orange-50 text-orange-700 border-orange-200',
                          amber: 'bg-amber-50 text-amber-700 border-amber-200',
                          yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
                          lime: 'bg-lime-50 text-lime-700 border-lime-200',
                          green: 'bg-green-50 text-green-700 border-green-200',
                          emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                          teal: 'bg-teal-50 text-teal-700 border-teal-200',
                          cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
                          sky: 'bg-sky-50 text-sky-700 border-sky-200',
                          blue: 'bg-blue-50 text-blue-700 border-blue-200',
                          indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                          violet: 'bg-violet-50 text-violet-700 border-violet-200',
                          purple: 'bg-purple-50 text-purple-700 border-purple-200',
                          fuchsia: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
                          pink: 'bg-pink-50 text-pink-700 border-pink-200',
                          rose: 'bg-rose-50 text-rose-700 border-rose-200'
                        }
                        return colorMap[color] || colorMap.gray
                      }
                      
                      return (
                        <span
                          key={tag.id}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border ${getColorClasses(tag.color)}`}
                        >
                          <span className="text-sm">{tag.icon}</span>
                          <span>{tag.name}</span>
                        </span>
                      )
                    })}
                  </div>
                )}
                
                {/* Debug: Show if no tags */}
                {bookTags.length === 0 && (
                  <div className="text-center mb-4">
                    <p className="text-sm text-gray-500">No tags selected</p>
                  </div>
                )}


              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 py-6 space-y-6 max-w-4xl mx-auto">
          {/* Book Details Card */}
          <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Info className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Book Information</h3>
              </div>
              <button
                onClick={() => setShowAllBookInfo(!showAllBookInfo)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                {showAllBookInfo ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Always Visible - Author and Published Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Author */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <User className="w-4 h-4" />
                    <span>Author</span>
                  </div>
                  <p className="font-semibold text-gray-900 text-lg">{book.author}</p>
                </div>

                {/* Published Date */}
                {book.publishedDate && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>Published</span>
                    </div>
                    <p className="font-semibold text-gray-900 text-lg">{book.publishedDate}</p>
                  </div>
                )}
              </div>

              {/* Expandable Content */}
              {showAllBookInfo && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                  {/* Publisher */}
                  {book.publisher && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Building className="w-4 h-4" />
                        <span>Publisher</span>
                      </div>
                      <p className="font-semibold text-gray-900 text-lg">{book.publisher}</p>
                    </div>
                  )}

                  {/* Page Count */}
                  {book.pageCount && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <BookOpen className="w-4 h-4" />
                        <span>Pages</span>
                      </div>
                      <p className="font-semibold text-gray-900 text-lg">{book.pageCount.toLocaleString()}</p>
                    </div>
                  )}

                  {/* Language */}
                  {book.language && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Globe className="w-4 h-4" />
                        <span>Language</span>
                      </div>
                      <p className="font-semibold text-gray-900 text-lg">{book.language.toUpperCase()}</p>
                    </div>
                  )}

                  {/* Edition */}
                  {book.edition && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Award className="w-4 h-4" />
                        <span>Edition</span>
                      </div>
                      <p className="font-semibold text-gray-900 text-lg">{book.edition}</p>
                    </div>
                  )}

                  {/* Added Date */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>Added to Library</span>
                    </div>
                    <p className="font-semibold text-gray-900 text-lg">{book.dateAdded}</p>
                  </div>

                  {/* ISBN */}
                  {book.isbn && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Hash className="w-4 h-4" />
                        <span>ISBN</span>
                      </div>
                      <p className="font-semibold text-gray-900 text-lg font-mono">{book.isbn}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tags Section */}
          <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-sm relative z-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Tag className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Manage Tags</h3>
            </div>
            
            <TagSelector
              selectedTagIds={bookTags}
              onTagsChange={handleTagsChange}
              className="w-full"
            />
          </div>

          {/* Description Section */}
          <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Description</h3>
            </div>
            
            {book.description ? (
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">
                  {book.description}
                </p>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-purple-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No Description Available</h4>
                <p className="text-gray-600 mb-4">This book doesn't have a description yet.</p>
                <p className="text-sm text-gray-500">
                  Descriptions are automatically added when books are found through search or ISBN scanning.
                </p>
              </div>
            )}
          </div>



          {/* Remove from Library Button */}
          <div className="text-center pt-6">
            <button
              onClick={() => router.push(`/book/${book.id}/delete`)}
              className="inline-flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Remove from Library
            </button>
          </div>


        </div>
      </div>






    </div>
  )
} 